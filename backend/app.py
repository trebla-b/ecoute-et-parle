from __future__ import annotations

import csv
import io
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .csv_store import CSVStore
from .models import (
    Attempt,
    AttemptCreate,
    DiffToken,
    Sentence,
    SentenceCreate,
    SentenceUpdate,
    now_iso,
)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
SENTENCES_CSV = DATA_DIR / "sentences.csv"
ATTEMPTS_CSV = DATA_DIR / "attempts.csv"

SENTENCE_FIELDS = [
    "id",
    "target_lang",
    "sentence_text",
    "translation_lang",
    "translation_text",
    "difficulty",
    "tags",
    "created_at",
    "updated_at",
]

ATTEMPT_FIELDS = [
    "id",
    "sentence_id",
    "target_lang",
    "asr_lang",
    "asr_text",
    "score",
    "words_total",
    "words_correct",
    "diff_json",
    "duration_ms",
    "created_at",
]


def create_app() -> FastAPI:
    app = FastAPI(title="Écoute et Parle API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    sentence_store = CSVStore(SENTENCES_CSV, SENTENCE_FIELDS)
    attempt_store = CSVStore(ATTEMPTS_CSV, ATTEMPT_FIELDS)

    def get_sentence_store() -> CSVStore:
        return sentence_store

    def get_attempt_store() -> CSVStore:
        return attempt_store

    # Sentences -------------------------------------------------------------

    @app.get("/api/sentences", response_model=List[Sentence])
    def list_sentences(
        limit: int = Query(100, ge=1, le=500),
        offset: int = Query(0, ge=0),
        difficulty: Optional[str] = Query(None),
        search: Optional[str] = Query(None),
        target_lang: Optional[str] = Query(None),
        translation_lang: Optional[str] = Query(None),
        store: CSVStore = Depends(get_sentence_store),
    ) -> List[Sentence]:
        rows = store.read_all()
        filtered: List[Sentence] = []
        for row in rows:
            sentence = sentence_from_row(row)
            if difficulty and sentence.difficulty != difficulty:
                continue
            if target_lang and sentence.target_lang != target_lang:
                continue
            if translation_lang and sentence.translation_lang != translation_lang:
                continue
            if search:
                haystack = (
                    f"{sentence.sentence_text} {sentence.translation_text or ''}".lower()
                )
                if search.lower() not in haystack:
                    continue
            filtered.append(sentence)
        return filtered[offset : offset + limit]

    @app.post("/api/sentences", response_model=Sentence, status_code=201)
    def create_sentence(
        payload: SentenceCreate, store: CSVStore = Depends(get_sentence_store)
    ) -> Sentence:
        sentence = Sentence(
            id=str(uuid.uuid4()),
            created_at=now_iso(),
            updated_at=now_iso(),
            **payload.model_dump(),
        )
        store.append(sentence_to_row(sentence))
        return sentence

    @app.put("/api/sentences/{sentence_id}", response_model=Sentence)
    def update_sentence(
        sentence_id: str,
        payload: SentenceUpdate,
        store: CSVStore = Depends(get_sentence_store),
    ) -> Sentence:
        existing_row = store.get(sentence_id)
        if not existing_row:
            raise HTTPException(status_code=404, detail="Sentence not found")
        sentence = sentence_from_row(existing_row)
        updated_data = sentence.model_dump()
        for key, value in payload.model_dump(exclude_unset=True).items():
            updated_data[key] = value
        updated_data["updated_at"] = now_iso()
        updated = Sentence(**updated_data)
        if not store.update(sentence_id, sentence_to_row(updated)):
            raise HTTPException(status_code=500, detail="Failed to update sentence")
        return updated

    @app.delete("/api/sentences/{sentence_id}", status_code=204)
    def delete_sentence(sentence_id: str, store: CSVStore = Depends(get_sentence_store)):
        if not store.delete(sentence_id):
            raise HTTPException(status_code=404, detail="Sentence not found")

    @app.get("/api/export/sentences")
    def export_sentences(store: CSVStore = Depends(get_sentence_store)):
        rows = store.read_all()
        stream = io.StringIO()
        writer = csv.DictWriter(stream, fieldnames=SENTENCE_FIELDS)
        writer.writeheader()
        writer.writerows(rows)
        stream.seek(0)
        filename = f"sentences_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
        return StreamingResponse(
            iter([stream.read()]),
            media_type="text/csv",
            headers=headers,
        )

    @app.post("/api/import/sentences")
    async def import_sentences(
        file: UploadFile = File(...),
        store: CSVStore = Depends(get_sentence_store),
    ):
        raw = await file.read()
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise HTTPException(status_code=400, detail="File must be UTF-8 encoded") from exc
        reader = csv.DictReader(io.StringIO(text))
        if reader.fieldnames is None:
            raise HTTPException(status_code=400, detail="CSV missing header row")
        required = {"sentence_text", "target_lang"}
        missing = required - set(reader.fieldnames)
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"CSV missing required columns: {', '.join(sorted(missing))}",
            )
        imported_rows = []
        count = 0
        for raw_row in reader:
            row = {field: (raw_row.get(field) or "").strip() for field in reader.fieldnames}
            if not row["sentence_text"]:
                continue
            sentence = Sentence(
                id=row.get("id") or str(uuid.uuid4()),
                sentence_text=row["sentence_text"],
                target_lang=row.get("target_lang") or "fr-FR",
                translation_text=row.get("translation_text") or None,
                translation_lang=row.get("translation_lang") or "zh-CN",
                difficulty=row.get("difficulty") or "medium",
                tags=row.get("tags") or "",
                created_at=row.get("created_at") or now_iso(),
                updated_at=row.get("updated_at") or now_iso(),
            )
            imported_rows.append(sentence_to_row(sentence))
            count += 1
        if not imported_rows:
            raise HTTPException(status_code=400, detail="No valid sentences found in CSV")
        store.replace_all(imported_rows)
        return {"imported": count}

    # Attempts --------------------------------------------------------------

    @app.get("/api/attempts", response_model=List[Attempt])
    def list_attempts(
        sentence_id: Optional[str] = Query(None),
        target_lang: Optional[str] = Query(None),
        store: CSVStore = Depends(get_attempt_store),
    ) -> List[Attempt]:
        rows = store.read_all()
        attempts = [attempt_from_row(row) for row in rows]
        if sentence_id:
            attempts = [attempt for attempt in attempts if attempt.sentence_id == sentence_id]
        if target_lang:
            attempts = [attempt for attempt in attempts if attempt.target_lang == target_lang]
        return attempts

    @app.post("/api/attempts", response_model=Attempt, status_code=201)
    def create_attempt(
        payload: AttemptCreate, store: CSVStore = Depends(get_attempt_store)
    ) -> Attempt:
        attempt = Attempt(
            id=str(uuid.uuid4()),
            created_at=now_iso(),
            **payload.model_dump(),
        )
        store.append(attempt_to_row(attempt))
        return attempt

    return app


def sentence_from_row(row: dict) -> Sentence:
    data = {
        "id": row.get("id") or str(uuid.uuid4()),
        "target_lang": row.get("target_lang") or "fr-FR",
        "sentence_text": row.get("sentence_text") or "",
        "translation_lang": row.get("translation_lang") or "zh-CN",
        "translation_text": row.get("translation_text") or None,
        "difficulty": row.get("difficulty") or "medium",
        "tags": row.get("tags") or "",
        "created_at": row.get("created_at") or now_iso(),
        "updated_at": row.get("updated_at") or now_iso(),
    }
    return Sentence(**data)


def sentence_to_row(sentence: Sentence) -> dict:
    data = sentence.model_dump()
    return {
        "id": data["id"],
        "target_lang": data["target_lang"],
        "sentence_text": data["sentence_text"],
        "translation_lang": data["translation_lang"],
        "translation_text": data.get("translation_text") or "",
        "difficulty": data.get("difficulty") or "",
        "tags": data.get("tags") or "",
        "created_at": data["created_at"],
        "updated_at": data["updated_at"],
    }


def attempt_from_row(row: dict) -> Attempt:
    diff_raw = row.get("diff_json") or "[]"
    try:
        diff = [DiffToken(**item) for item in json.loads(diff_raw)]
    except json.JSONDecodeError:
        diff = []
    data = {
        "id": row.get("id") or str(uuid.uuid4()),
        "sentence_id": row.get("sentence_id") or "",
        "target_lang": row.get("target_lang") or "fr-FR",
        "asr_lang": row.get("asr_lang") or row.get("target_lang") or "fr-FR",
        "asr_text": row.get("asr_text") or "",
        "score": float(row.get("score") or 0),
        "words_total": int(row.get("words_total") or 0),
        "words_correct": int(row.get("words_correct") or 0),
        "diff_json": diff,
        "duration_ms": int(row.get("duration_ms") or 0),
        "created_at": row.get("created_at") or now_iso(),
    }
    return Attempt(**data)


def attempt_to_row(attempt: Attempt) -> dict:
    data = attempt.model_dump()
    return {
        "id": data["id"],
        "sentence_id": data["sentence_id"],
        "target_lang": data["target_lang"],
        "asr_lang": data["asr_lang"],
        "asr_text": data["asr_text"],
        "score": f"{data['score']}",
        "words_total": str(data["words_total"]),
        "words_correct": str(data["words_correct"]),
        "diff_json": json.dumps([token.model_dump() for token in data["diff_json"]]),
        "duration_ms": str(data["duration_ms"]),
        "created_at": data["created_at"],
    }


app = create_app()
