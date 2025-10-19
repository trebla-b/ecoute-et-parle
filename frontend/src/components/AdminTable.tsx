import { useMemo, useState } from "react";
import { TARGET_LANGUAGES, TRANSLATION_LANGUAGES } from "../lib/languages";
import { Sentence } from "../lib/types";

export type EditableSentence = Pick<
  Sentence,
  "sentence_text" | "translation_text" | "target_lang" | "translation_lang" | "difficulty" | "tags"
>;

interface AdminTableProps {
  sentences: Sentence[];
  onCreate: (data: EditableSentence) => Promise<void>;
  onUpdate: (id: string, data: EditableSentence) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

const DEFAULT_SENTENCE: EditableSentence = {
  sentence_text: "",
  translation_text: "",
  target_lang: "fr-FR",
  translation_lang: "zh-CN",
  difficulty: "medium",
  tags: ""
};

export function AdminTable({ sentences, onCreate, onUpdate, onDelete, loading }: AdminTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableSentence>(DEFAULT_SENTENCE);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderedSentences = useMemo(
    () => [...sentences].sort((a, b) => a.sentence_text.localeCompare(b.sentence_text)),
    [sentences]
  );

  const startEdit = (sentence: Sentence) => {
    setEditingId(sentence.id);
    setIsCreating(false);
    setDraft({
      sentence_text: sentence.sentence_text,
      translation_text: sentence.translation_text ?? "",
      target_lang: sentence.target_lang,
      translation_lang: sentence.translation_lang,
      difficulty: sentence.difficulty,
      tags: sentence.tags ?? ""
    });
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setDraft(DEFAULT_SENTENCE);
  };

  const cancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setDraft(DEFAULT_SENTENCE);
    setError(null);
  };

  const handleChange = (key: keyof EditableSentence, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!draft.sentence_text.trim()) {
      setError("Le texte de la phrase est requis.");
      return;
    }

    setError(null);

    try {
      if (isCreating) {
        await onCreate(draft);
      } else if (editingId) {
        await onUpdate(editingId, draft);
      }
      cancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="card admin-table">
      <header className="admin-header">
        <h2>Banque de phrases</h2>
        <button type="button" onClick={startCreate}>
          ➕ Ajouter
        </button>
      </header>
      {error ? <p className="error">{error}</p> : null}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Phrase</th>
              <th>Langue cible</th>
              <th>Traduction</th>
              <th>Langue trad.</th>
              <th>Difficulté</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isCreating ? (
              <EditableRow
                draft={draft}
                onChange={handleChange}
                onCancel={cancel}
                onSubmit={handleSubmit}
                busy={loading}
              />
            ) : null}
            {orderedSentences.map((sentence) =>
              editingId === sentence.id ? (
                <EditableRow
                  key={sentence.id}
                  draft={draft}
                  onChange={handleChange}
                  onCancel={cancel}
                  onSubmit={handleSubmit}
                  busy={loading}
                />
              ) : (
                <tr key={sentence.id}>
                  <td>{sentence.sentence_text}</td>
                  <td>{sentence.target_lang}</td>
                  <td>{sentence.translation_text || "—"}</td>
                  <td>{sentence.translation_lang}</td>
                  <td>
                    <span className={`badge difficulty ${sentence.difficulty}`}>
                      {sentence.difficulty}
                    </span>
                  </td>
                  <td>{sentence.tags || "—"}</td>
                  <td className="actions">
                    <button type="button" onClick={() => startEdit(sentence)}>
                      ✏️ Modifier
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => onDelete(sentence.id)}
                      disabled={loading}
                    >
                      🗑️ Supprimer
                    </button>
                  </td>
                </tr>
              )
            )}
            {!sentences.length && !isCreating ? (
              <tr>
                <td colSpan={7} className="muted">
                  Importez un CSV ou ajoutez une phrase pour commencer.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface EditableRowProps {
  draft: EditableSentence;
  onChange: (key: keyof EditableSentence, value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  busy?: boolean;
}

function EditableRow({ draft, onChange, onCancel, onSubmit, busy }: EditableRowProps) {
  return (
    <tr className="editing-row">
      <td>
        <textarea
          value={draft.sentence_text}
          onChange={(event) => onChange("sentence_text", event.target.value)}
          rows={2}
        />
      </td>
      <td>
        <select
          value={draft.target_lang}
          onChange={(event) => onChange("target_lang", event.target.value)}
        >
          {TARGET_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <textarea
          value={draft.translation_text ?? ""}
          onChange={(event) => onChange("translation_text", event.target.value)}
          rows={2}
        />
      </td>
      <td>
        <select
          value={draft.translation_lang}
          onChange={(event) => onChange("translation_lang", event.target.value)}
        >
          {TRANSLATION_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <select
          value={draft.difficulty}
          onChange={(event) => onChange("difficulty", event.target.value)}
        >
          <option value="easy">Facile</option>
          <option value="medium">Moyen</option>
          <option value="hard">Difficile</option>
        </select>
      </td>
      <td>
        <input
          type="text"
          value={draft.tags ?? ""}
          onChange={(event) => onChange("tags", event.target.value)}
          placeholder="vocabulaire, grammaire"
        />
      </td>
      <td className="actions">
        <button type="button" onClick={onSubmit} disabled={busy}>
          💾 Sauvegarder
        </button>
        <button type="button" className="danger" onClick={onCancel} disabled={busy}>
          Annuler
        </button>
      </td>
    </tr>
  );
}

export default AdminTable;
