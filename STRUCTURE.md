# STRUCTURE.md

## 1) One-liner
A local-first web app to **listen → (optionally) read → repeat** sentences in the learner’s chosen **target language**, get **pronunciation scoring with per-word highlights**, and manage the sentence bank via a no-auth **Admin** page. All data is persisted in **CSV files** on localhost.

---

## 2) User stories
- **Learner**
  - I can play a sentence using a **more natural voice** (best available TTS voice for the selected target language; defaults to French).
  - I can toggle the transcript and a translation rendered in my selected **translation language** (defaults to Simplified Chinese).
  - I can choose a different voice/language pair for playback at any time.
  - I can press a mic button, speak, and get an immediate score (good/bad) with word-level diffs showing what I mispronounced or missed.
  - I can retry a sentence and see my attempt history.
- **Learner (accessibility)**
  - Speech capture works on every major browser thanks to a Vosk WASM fallback when the Web Speech API is unavailable.
  - Keyboard shortcuts (Space = play/pause, M = mic, R = next) keep working no matter the language.
- **Admin**
  - I can add, edit, and delete sentences (sentence text, translation text, language metadata, difficulty tag).
  - I can configure default target/translation languages and voice suggestions.
  - I can bulk import/export the sentence bank to/from CSV.
  - I can view anonymised aggregate stats (per sentence: attempts, success rate).

_No authentication. Everything runs on localhost._

---

## 3) Architecture (MVP)
**Frontend (browser):**
- Vite + React UI with two routes (`/` practice, `/admin` admin).
- Speech layer:
  - **Web Speech API** when available for STT.
  - **Vosk WASM** fallback for browsers without native STT (loadable model assets).
  - TTS via `speechSynthesis` with **voice-picker UI** (prefers enhanced voices such as Google/Apple).
- Diff/align: dynamic word-level alignment (Needleman-Wunsch/Levenshtein) in TypeScript.

**Backend (local server):**
- **FastAPI** serving:
  - REST endpoints for sentences and attempts (CRUD, filters by language).
  - CSV adapter for persistence (file locks).
  - Static file delivery (front-end build assets).
  - (Stretch) endpoints for caching higher-quality TTS audio.

**Storage (CSV files):**
- `data/sentences.csv`
- `data/attempts.csv`
- `data/meta.csv` (optional: schema version, default language settings)

---

## 4) File & folder layout
```
project/
  frontend/
    index.html
    src/
      main.tsx
      App.tsx
      components/
        Player.tsx
        MicRecorder.tsx
        DiffView.tsx
        ToggleText.tsx
        AdminTable.tsx
        ImportExport.tsx
        VoiceSelector.tsx
        LanguageSelector.tsx
      lib/
        align.ts        # word/token alignment utils
        csv.ts          # csv parse/stringify (Papaparse)
        speech.ts       # TTS/STT wrappers + voice discovery
        vosk.ts         # WASM loader + transcription helper
        languages.ts    # language metadata + defaults
        api.ts          # fetch helpers
  backend/
    app.py             # FastAPI app
    models.py          # Pydantic schemas
    csv_store.py       # CSV read/write with file locking
    settings.py        # Defaults (languages, voices)
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
| id | target_lang | sentence_text | translation_lang | translation_text | difficulty | tags | created_at | updated_at |
|---:|---|---|---|---|---|---|---|---|
| UUID | BCP-47 language (e.g. `fr-FR`) | sentence in target language | BCP-47 language (e.g. `zh-CN`) | translation | easy/medium/hard | comma-separated keywords | ISO8601 | ISO8601 |

### `attempts.csv`
| id | sentence_id | target_lang | asr_lang | asr_text | score | words_total | words_correct | diff_json | duration_ms | created_at |
|---:|---|---|---|---|---|---:|---:|---|---:|---|
| UUID | FK → sentences.id | BCP-47 of sentence | BCP-47 used for STT | recognized text | 0/1 (bad/good) | int | int | JSON string (per-token ops) | int | ISO8601 |

_Notes:_
- `diff_json` contains array of tokens `{op: 'match'|'sub'|'ins'|'del', ref: 'mot', hyp: 'mauvais'}`.
- All timestamps in local time (ISO8601). Use newline-safe CSV (quote fields).
- `target_lang` defaults to `fr-FR`, `translation_lang` defaults to `zh-CN`.

---

## 6) API design (REST)
**Base URL**: `http://localhost:5173` (frontend dev) and `http://localhost:8000/api` (backend)

- `GET /api/sentences?limit&offset&difficulty&search&target_lang&translation_lang`
- `POST /api/sentences`
  ```json
  {
    "sentence_text": "...",
    "target_lang": "fr-FR",
    "translation_text": "...",
    "translation_lang": "zh-CN",
    "difficulty": "medium",
    "tags": "..."
  }
  ```
  → returns full `Sentence`.
- `PUT /api/sentences/{id}`
- `DELETE /api/sentences/{id}`
- `POST /api/attempts`
  ```json
  {
    "sentence_id": "...",
    "asr_lang": "fr-FR",
    "asr_text": "...",
    "score": 1,
    "words_total": 12,
    "words_correct": 11,
    "diff_json": [],
    "duration_ms": 5600
  }
  ```
- `GET /api/attempts?sentence_id=&target_lang=`
- `GET /api/export/sentences` → CSV download
- `POST /api/import/sentences` (multipart CSV upload, replace mode)
- (Stretch) `GET /api/voices` to surface cached high-quality voices metadata.

**CORS:** allow `http://localhost:*`

---

## 7) Core flows
### A) Practice flow
1. Client fetches a sentence that matches the active language filters.
2. TTS speaks `sentence_text` in `target_lang` using the preferred voice (default: best-match for `fr-FR`).
3. User taps **Mic** → capture speech; on end, get `asr_text` from Web Speech API or Vosk fallback.
4. Tokenize `sentence_text` vs `asr_text` (language-aware normalization).
5. Run alignment → compute per-token ops + accuracy = `words_correct / words_total`.
6. Compute binary `score` (≥ 90% → 1 else 0) and store `asr_lang`.
7. POST attempt to backend; render `DiffView` with colored tokens.
8. Show **Retry** button; allow next sentence.

### B) Admin CRUD
1. Open `/admin` route (no auth).
2. Table lists sentences with language metadata; inline edit.
3. Add | Edit | Delete rows; change difficulty/tags and language defaults.
4. Import CSV (replace); Export CSV.
5. Manage global defaults (target language, translation language, preferred voice id).

---

## 8) Scoring & alignment details
- **Normalization**: lowercasing, Unicode NFKC, remove non-letters except apostrophes/hyphens, split on apostrophes (French-friendly rules; extendable via language map).
- **Alignment**: dynamic programming (Levenshtein with backtrace on token level). Weight substitutions > insertions ≈ deletions.
- **Good/Bad rule** (MVP): `accuracy >= 0.90 AND no critical word missed` → good.
- **Per-word heat**: map ops to CSS classes: match ✓, sub ~, del ×, ins + (in hypothesis only).

---

## 9) Accessibility & i18n
- Provide **Play/Pause** controls and keyboard shortcuts.
- Visually clear token highlights; ARIA live region for results.
- UI strings prepared for localisation; defaults to French UI with Chinese translations for content, but language selectors allow switching target/translation pairs.
- Voice selector announces active voice; fallback instructions for downloading Vosk model when automatic STT is unavailable.

---

## 10) Build & run (local)
### Backend
```bash
uv venv && source .venv/bin/activate
uv pip install -r backend/requirements.txt
uvicorn backend.app:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm i
npm run dev    # serves on :5173, proxy to :8000
```

### Vosk fallback (optional)
Download a Vosk model (e.g. `vosk-model-small-fr-0.22`) and place it under `frontend/public/vosk/fr/`. The app will fetch it automatically when Web Speech API is unavailable.

---

## 11) Testing
- **Unit**: alignment function (gold pairs), CSV adapter (append, update, delete), API contracts.
- **E2E**: Playwright: practice flow, admin CRUD, language switching, import/export.
- **Manual**: Browser matrix (Chrome/Edge/Firefox/Safari); ensure Vosk fallback activates where Web Speech API is absent.

---

## 12) Stretch goals (post-MVP)
- Pre-generated high-quality neural TTS cached server-side.
- Per-phoneme scoring (requires forced alignment / phoneme decoder).
- Spaced-repetition queues based on success history.
- Tag-based playlists and adaptive difficulty progression.
- Multi-translation support per sentence (store as JSON column in CSV).
