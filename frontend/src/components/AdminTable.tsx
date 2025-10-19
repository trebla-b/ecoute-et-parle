import { useMemo, useState } from "react";
import { Sentence } from "../lib/types";

type EditableSentence = Pick<Sentence, "fr_text" | "en_text" | "difficulty" | "tags">;

interface AdminTableProps {
  sentences: Sentence[];
  onCreate: (data: EditableSentence) => Promise<void>;
  onUpdate: (id: string, data: EditableSentence) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

const DEFAULT_SENTENCE: EditableSentence = {
  fr_text: "",
  en_text: "",
  difficulty: "medium",
  tags: ""
};

export function AdminTable({ sentences, onCreate, onUpdate, onDelete, loading }: AdminTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableSentence>(DEFAULT_SENTENCE);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderedSentences = useMemo(
    () => [...sentences].sort((a, b) => a.fr_text.localeCompare(b.fr_text)),
    [sentences]
  );

  const startEdit = (sentence: Sentence) => {
    setEditingId(sentence.id);
    setIsCreating(false);
    setDraft({
      fr_text: sentence.fr_text,
      en_text: sentence.en_text ?? "",
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
    if (!draft.fr_text.trim()) {
      setError("Le texte français est requis.");
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
              <th>Français</th>
              <th>Anglais</th>
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
                  <td>{sentence.fr_text}</td>
                  <td>{sentence.en_text || "—"}</td>
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
                <td colSpan={5} className="muted">
                  Importez une CSV ou ajoutez une phrase pour commencer.
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
          value={draft.fr_text}
          onChange={(event) => onChange("fr_text", event.target.value)}
          rows={2}
        />
      </td>
      <td>
        <textarea
          value={draft.en_text ?? ""}
          onChange={(event) => onChange("en_text", event.target.value)}
          rows={2}
        />
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
