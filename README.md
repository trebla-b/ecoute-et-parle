# Écoute et Parle

Outil local‑first pour s'entraîner à écouter et prononcer des phrases dans la langue de son choix. Tout tourne en local : FastAPI pour l'API, Vite + React pour l'interface, stockage dans des fichiers CSV.

## Fonctionnalités
- Mode **Pratique** :
  - Choisir la **langue cible** (par défaut français) et la **langue de traduction** (par défaut chinois simplifié).
  - Sélectionner une voix de synthèse plus naturelle lorsque le navigateur en propose (Google/Neural/WaveNet, etc.).
- Écouter, afficher/masquer texte & traduction, enregistrer sa prononciation (Web Speech API — pris en charge sur Google Chrome), obtenir un score et une mise en évidence des mots réussis/manqués.
- Mode **Admin** : CRUD complet sur la banque de phrases avec métadonnées de langue, filtres par difficulté/langue, import/export CSV.
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
- Navigateur recommandé : **Google Chrome** (Web Speech API requise pour l'enregistrement).

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
   L'interface est disponible sur `http://localhost:8050` (proxy configuré vers l'API).

3. Lancer le backend :
   ```bash
   uvicorn backend.app:app --reload --port 8001
   ```

> ⚠️ La reconnaissance vocale repose sur la Web Speech API disponible sur Chrome desktop. Sur les navigateurs qui ne l'exposent pas (Firefox, Safari, Brave…), l'enregistrement ne fonctionnera pas.

## Données CSV
- `data/sentences.csv` : 60 phrases initiales (facile/moyen/difficile) générées via `scripts/seed_sentences.py`. Colonnes :
  - `sentence_text`, `target_lang`, `translation_text`, `translation_lang`, `difficulty`, `tags`, `timestamps`.
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

- Frontend accessible sur `http://localhost:8050`
- API disponible sur `http://localhost:8001`
- Les CSV sont montés depuis `./data` pour persister les modifications.

## Licence
Projet prototypique pour un usage local uniquement.
