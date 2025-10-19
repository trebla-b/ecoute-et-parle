# STRUCTURE.md

## 1) One‑liner
A local‑first web app to **listen → (optionally) read → repeat** French sentences, get **pronunciation scoring with per‑word highlights**, and manage the sentence bank via a no‑auth **Admin** page. All data is persisted in **CSV files** on localhost.

---

## 2) User stories
- **Learner**
  - I can play a French sentence (audio) and optionally reveal the transcript.
  - I can press a mic button, speak, and get an immediate score (good/bad) with word‑level diffs showing what I mispronounced or missed.
  - I can retry a sentence and see my attempt history.
  - I can toggle an English translation.
- **Admin**
  - I can add, edit, and delete sentences (French text, optional slow/normal TTS audio, translation, difficulty tag).
  - I can bulk import/export the sentence bank to/from CSV.
  ￼  - I can view anonymized aggregate stats (per sentence: attempts, success rate).

_No authentication. Everything runs on localhost._

---

## 3) Architecture (MVP)
**Frontend (browser):**
- Vite + React (or plain vanilla + HTMX acceptable). 
- Uses **Web Speech API** (if available) for STT (speech‑to‑text) and TTS (text‑to‑speech). Fallback: bundled **Vosk WASM** for STT and browser **SpeechSynthesis** for TTS.
- Diff/align: dynamic word‑level alignment using a lightweight Needleman‑Wunsch or Levenshtein alignment (JS implementation) for highlighting.

**Backend (local server):**
- **FastAPI** (Python) serving:
  - Static frontend
  - REST endpoints for sentences and attempts (CRUD)
  - CSV adapter for persistence
- Optional: **Edge‑free** (no DB) — just CSV files + file locks.

**Storage (CSV files):**
- `data/sentences.csv`
- `data/attempts.csv`
- `data/meta.csv` (optional: schema version, created_at)

---

## 4) File & folder layout
```
project/
  frontend/
    index.html
    src/
      main.js
      App.jsx
      components/
        Player.jsx
        MicRecorder.jsx
        DiffView.jsx
        ToggleText.jsx
        AdminTable.jsx
        ImportExport.jsx
      lib/
        align.ts        # word/token alignment utils
        csv.ts          # csv parse/stringify (Papaparse)
        speech.ts       # TTS/STT wrappers
        api.ts          # fetch helpers
  backend/
    app.py             # FastAPI app
    models.py          # Pydantic schemas
    csv_store.py       # CSV read/write with file locking
    align.py           # (optional) server‑side alignment
  data/
    sentences.csv
    attempts.csv
  scripts/
    seed_sentences.py
  STRUCTURE.md
  AGENTS.md
  README.md
```

---

## 5) CSV schemas
### `sentences.csv`
| id | fr_text | en_text | difficulty | tags | created_at | updated_at |
|---:|---|---|---|---|---|---|
| UUID | full French sentence | optional English | easy/medium/hard | comma‑sep keywords | ISO8601 | ISO8601 |

### `attempts.csv`
| id | sentence_id | asr_text | score | words_total | words_correct | diff_json | duration_ms | created_at |
|---:|---|---:|---:|---:|---:|---|---:|---|
| UUID | FK to sentences | recognized text | 0/1 (bad/good) | int | int | JSON string (per‑token ops) | int | ISO8601 |

_Notes:_
- `diff_json` contains array of tokens with operation `{op: 'match'|'sub'|'ins'|'del', ref: 'mot', hyp: 'mauvais'}`.
- All timestamps in local time (ISO8601). Use newline‑safe CSV (quote fields).

---

## 6) API design (REST)
**Base URL**: `http://localhost:5173` (frontend dev) and `http://localhost:8000/api` (backend)

- `GET /api/sentences?limit&offset&difficulty&search`
- `POST /api/sentences` `{fr_text, en_text?, difficulty?, tags?}` → `{id,...}`
- `PUT /api/sentences/{id}`
- `DELETE /api/sentences/{id}` (soft delete not needed)
- `POST /api/attempts` `{sentence_id, asr_text, score, words_total, words_correct, diff_json, duration_ms}`
- `GET /api/attempts?sentence_id` (for admin stats)
- `GET /api/export/sentences` → CSV download
- `POST /api/import/sentences` (multipart CSV upload)

**CORS:** allow `http://localhost:*` 

---

## 7) Core flows
### A) Practice flow
1. Client fetches a sentence.
2. TTS speaks `fr_text` (or play pre‑baked audio later as stretch).
3. User taps **Mic** → capture speech; on end, get `asr_text`.
4. Tokenize `fr_text` vs `asr_text` (lowercase, strip punctuation, unify apostrophes: l' → le + _placeholder_).
5. Run alignment → compute per‑token ops + accuracy = `words_correct / words_total`.
6. Compute `score` (MVP binary: ≥ 90% → 1 else 0). 
7. POST attempt to backend; render `DiffView` with colored tokens.
8. Show **Retry** button; allow next sentence.

### B) Admin CRUD
1. Open `/admin` route (no auth).
2. Table lists sentences; inline edit.
3. Add | Edit | Delete rows; change difficulty/tags.
4. Import CSV (append or replace); Export CSV.

---

## 8) Scoring & alignment details
- **Normalization**: lowercasing, Unicode NFKC, remove non‑letters except apostrophes/hyphens, split on spaces and apostrophes (keep elisions as tokens: _l’_ ⇒ `le` with rule set, or keep `l'ami`).
- **Alignment**: dynamic programming (Levenshtein with backtrace on token level). Weight substitutions > insertions ~ deletions.
- **Good/Bad rule** (MVP): `accuracy >= 0.90 AND no critical word missed` → good.
- **Per‑word heat**: map ops to CSS classes: match ✓, sub ~, del ×, ins + (in hypothesis only).

---

## 9) Accessibility & i18n
- Provide **Play/Pause** controls and keyboard shortcuts.
- Visually clear token highlights; ARIA live region for results.
- UI strings in French/English JSON (but app content is French).

---

## 10) Build & run (local)
### Backend
```bash
uv venv && source .venv/bin/activate
uv add fastapi uvicorn pydantic pandas filelock python-multipart
uvicorn backend.app:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm i
npm run dev    # serves on :5173
```

---

## 11) Testing
- **Unit**: alignment function (gold pairs), CSV adapter (append, update, delete), API contracts.
- **E2E**: Playwright: practice flow, admin CRUD, import/export.
- **Manual**: Browser matrix (Chrome/Edge/Firefox; note Web Speech API on Firefox is limited → verify Vosk fallback).

---

## 12) Stretch goals (post‑MVP)
- Pre‑generated high‑quality TTS (slow/normal) and audio waveform.
- Per‑phoneme scoring (requires forced alignment / phoneme decoder; not MVP).
- Spaced‑repetition queues based on success history.
- Tags + filters, difficulty progression.
