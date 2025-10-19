# AGENTS.md

> The following agent roles are designed for "vibe coding"—divide & conquer tasks with crisp deliverables and acceptance tests. Agents assume localhost only, no auth, CSV storage.

## Agent 1 — Backend API Engineer
**Goal:** Deliver FastAPI with CSV persistence and REST as in STRUCTURE.md.

**Tasks**
1. Scaffold FastAPI app with routes: sentences, attempts, import/export.
2. Implement `csv_store.py` with file locks and safe appends; headers auto‑create.
3. Validate payloads with Pydantic models.
4. Implement CSV import (replace mode) and export.
5. Add simple stats endpoint `/api/attempts?sentence_id=`.

**Acceptance**
- `uvicorn backend.app:app --reload` starts; `GET /api/sentences` returns array.
- POST/PUT/DELETE work and persist to `data/*.csv`.
- Importing a sample CSV populates `sentences.csv`.

**Out of scope:** Auth, DB, cloud.

---

## Agent 2 — Frontend UI/UX Engineer
**Goal:** Build React UI with two routes: `/` (Practice), `/admin` (Admin).

**Tasks**
1. Practice screen: sentence card, Play TTS, Show/Hide French text, Show/Hide English translation, Mic button, Result panel with DiffView and score chip, Retry.
2. Admin screen: table CRUD (inline), import/export controls, filter by difficulty.
3. `api.ts` with fetch wrappers; optimistic UI for CRUD.
4. Responsive layout; keyboard shortcuts: Space=Play/Pause, M=Mic, R=Retry.

**Acceptance**
- Running `npm run dev` shows functional flows.
- DiffView highlights correct/missed words.
- Admin can add/edit/delete and changes persist.

---

## Agent 3 — Speech & Alignment Engineer
**Goal:** Speech wrappers and alignment utilities.

**Tasks**
1. `speech.ts`: 
   - `speak(text, {rate})` using `window.speechSynthesis`.
   - `record(timeoutMs)` using Web Speech API; if unavailable, provide stub/fallback hooks for Vosk WASM.
2. `align.ts`: implement tokenization + DP alignment, return ops array and accuracy.
3. Edge cases: apostrophes (l’/d’), punctuation, numbers.

**Acceptance**
- Unit tests pass for alignment on French examples.
- Recording works on Chrome; returns transcript string.

---

## Agent 4 — Data & Content Curator
**Goal:** Provide initial `sentences.csv` with ~60 entries across difficulty levels.

**Schema:** per STRUCTURE.md.

**Acceptance**
- CSV validates; no empty `fr_text`; difficulty ∈ {easy,medium,hard}.

---

## Agent 5 — QA & Tooling
**Goal:** Testing, linting, and DX.

**Tasks**
1. Add Playwright E2E for practice/admin flows.
2. Add simple unit tests (Vitest) for `align.ts`.
3. Prettier + ESLint config; `npm run test` and `npm run e2e`.

**Acceptance**
- CI (local script) runs tests and reports green.

---

## Common definitions
**Tokenization rules (French)**
- Normalize: lower, NFKC.
- Replace `’` with `'`.
- Split on spaces and apostrophes; keep words with accents.
- Optional mapping: `l' → le` for target and hypothesis before alignment.

**Good/Bad threshold**
- `accuracy >= 0.90` → good; else bad.

**CSV safety**
- Use quoting for any field containing comma/quote/newline.
- File locking during writes (advisory lock or `filelock`).

---

## Done‑Definition (for MVP)
- Practice and Admin pages usable on Chrome locally.
- Sentences & attempts persist in CSV.
- Scoring and diff visualization work for typical sentences.
- Import/Export CSV round‑trips without data loss.
