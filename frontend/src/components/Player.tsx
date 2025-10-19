import { Sentence } from "../lib/types";

interface PlayerProps {
  sentence: Sentence | null;
  showFrench: boolean;
  showEnglish: boolean;
  onPlay: () => void;
}

export function Player({ sentence, showFrench, showEnglish, onPlay }: PlayerProps) {
  if (!sentence) {
    return <div className="card">Aucune phrase disponible.</div>;
  }

  return (
    <article className="card player-card">
      <header className="player-header">
        <span className={`badge difficulty ${sentence.difficulty}`}>{sentence.difficulty}</span>
        <button type="button" onClick={onPlay} className="play-button">
          ▶️ Écouter
        </button>
      </header>
      <section className="player-body">
        {showFrench ? <p className="sentence-text">{sentence.fr_text}</p> : null}
        {showEnglish ? <p className="sentence-translation">{sentence.en_text || "—"}</p> : null}
      </section>
      {sentence.tags && (
        <footer className="player-footer">
          <small>Mots-clés : {sentence.tags}</small>
        </footer>
      )}
    </article>
  );
}

export default Player;
