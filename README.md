# Écoute et Parle

Outil local‑first pour s'entraîner à écouter et prononcer des phrases en français. Tout tourne en local : FastAPI pour l'API, Vite + React pour l'interface, stockage dans des fichiers CSV.

## Fonctionnalités
- Mode **Pratique** : écouter la phrase, afficher/masquer texte & traduction, enregistrer sa prononciation, obtenir un score et une mise en évidence des mots réussis/manqués.
- Mode **Admin** : CRUD complet sur la banque de phrases, import/export CSV, filtre par difficulté.
- Alignement mot à mot et calcul d'accuracy (Levenshtein), stockage des tentatives avec `diff_json`.
- API REST locale (`/api`) sans authentification.

## Structure
```
backend/            # FastAPI + stockage CSV
frontend/           # Vite + React (TS)
data/               # CSV persistants (sentences, attempts)
scripts/            # utilitaires (seed, etc.)
```

## Prérequis
- Python 3.11+
- Node.js 18+

## Installation & exécution (mode dev)
1. Créer et activer un environnement Python (optionnel) puis installer les dépendances :
   ```bash
   cd backend
   uv pip install fastapi uvicorn pydantic filelock python-multipart
   ```
   ou, sans `uv` :
   ```bash
   pip install fastapi uvicorn pydantic filelock python-multipart
   ```

2. Installer les dépendances frontend :
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   L'interface est disponible sur `http://localhost:5173` (proxy configuré vers l'API).

3. Lancer le backend :
   ```bash
   uvicorn backend.app:app --reload --port 8000
   ```

## Données CSV
- `data/sentences.csv` : 60 phrases initiales (facile/moyen/difficile) générées via `scripts/seed_sentences.py`.
- `data/attempts.csv` : en-tête uniquement, se remplit au fil des sessions.

Pour regénérer les phrases :
```bash
python3 scripts/seed_sentences.py
```

## Tests
- Frontend : `npm run test` (Vitest) pour tester les fonctions d'alignement.
- E2E (placeholder) : `npm run e2e` (Playwright) — à compléter selon les besoins.

## Docker
Lancer l'application complète :
```bash
docker compose up --build
```

- Frontend accessible sur `http://localhost:5173`
- API disponible sur `http://localhost:8000`
- Les CSV sont montés depuis `./data` pour persister les modifications.

## Licence
Projet prototypique pour un usage local uniquement.
