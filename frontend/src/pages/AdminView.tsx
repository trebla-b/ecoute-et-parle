import { useEffect, useMemo, useState } from "react";
import AdminTable, { EditableSentence } from "../components/AdminTable";
import ImportExport from "../components/ImportExport";
import { api } from "../lib/api";
import { TARGET_LANGUAGES, TRANSLATION_LANGUAGES } from "../lib/languages";
import { Sentence } from "../lib/types";

type DifficultyFilter = "all" | "easy" | "medium" | "hard";
type LanguageFilter = "all" | string;

export function AdminView() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [targetFilter, setTargetFilter] = useState<LanguageFilter>("all");
  const [translationFilter, setTranslationFilter] = useState<LanguageFilter>("all");

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await api.getSentences({ limit: 500 });
      setSentences(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const filteredSentences = useMemo(() => {
    return sentences.filter((sentence) => {
      if (difficultyFilter !== "all" && sentence.difficulty !== difficultyFilter) {
        return false;
      }
      if (targetFilter !== "all" && sentence.target_lang !== targetFilter) {
        return false;
      }
      if (translationFilter !== "all" && sentence.translation_lang !== translationFilter) {
        return false;
      }
      return true;
    });
  }, [sentences, difficultyFilter, targetFilter, translationFilter]);

  const sanitizePayload = (data: EditableSentence) => ({
    sentence_text: data.sentence_text,
    translation_text: data.translation_text?.trim() || "",
    target_lang: data.target_lang,
    translation_lang: data.translation_lang,
    difficulty: data.difficulty,
    tags: data.tags ?? ""
  });

  const handleCreate = async (data: EditableSentence) => {
    await api.createSentence(sanitizePayload(data));
    await refresh();
  };

  const handleUpdate = async (id: string, data: EditableSentence) => {
    await api.updateSentence(id, sanitizePayload(data));
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cette phrase ?")) return;
    await api.deleteSentence(id);
    await refresh();
  };

  const handleImport = async (file: File) => {
    await api.importSentences(file);
    await refresh();
  };

  const handleExport = async () => {
    const blob = await api.exportSentences();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sentences.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  return (
    <section className="admin-view">
      <header className="card admin-intro">
        <h1>Administration</h1>
        <p>
          Ajoutez, mettez à jour et exportez la banque de phrases. Toutes les données restent sur
          votre machine dans <code>data/sentences.csv</code>.
        </p>
        <div className="filters">
          <label>
            Difficulté :
            <select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}
            >
              <option value="all">Toutes</option>
              <option value="easy">Facile</option>
              <option value="medium">Moyen</option>
              <option value="hard">Difficile</option>
            </select>
          </label>
          <label>
            Langue cible :
            <select
              value={targetFilter}
              onChange={(event) => setTargetFilter(event.target.value as LanguageFilter)}
            >
              <option value="all">Toutes</option>
              {TARGET_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Langue de traduction :
            <select
              value={translationFilter}
              onChange={(event) => setTranslationFilter(event.target.value as LanguageFilter)}
            >
              <option value="all">Toutes</option>
              {TRANSLATION_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={refresh} disabled={loading}>
            🔄 Actualiser
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </header>

      <AdminTable
        sentences={filteredSentences}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        loading={loading}
      />

      <ImportExport onImport={handleImport} onExport={handleExport} busy={loading} />
    </section>
  );
}

export default AdminView;
