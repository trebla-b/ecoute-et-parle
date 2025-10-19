import { getLanguageLabel } from "../lib/languages";
import { Sentence } from "../lib/types";

interface PlayerProps {
  sentence: Sentence | null;
  showSentenceText: boolean;
  showTranslation: boolean;
  onPlay: () => void;
  targetLang: string;
  translationLang: string;
}

export function Player({
  sentence,
  showSentenceText,
  showTranslation,
  onPlay,
  targetLang,
  translationLang
}: PlayerProps) {
  if (!sentence) {
    return <div className="card">Aucune phrase disponible.</div>;
  }

  const translationAvailable =
    sentence.translation_text &&
    (!translationLang || sentence.translation_lang === translationLang);

  return (
    <article className="card player-card">
      <header className="player-header">
        <span className={`badge difficulty ${sentence.difficulty}`}>{sentence.difficulty}</span>
        <button type="button" onClick={onPlay} className="play-button">
          ▶️ Écouter
        </button>
      </header>
      <section className="player-body">
        {showSentenceText ? (
          <div>
            <p className="sentence-text">{sentence.sentence_text}</p>
            <small className="muted">{getLanguageLabel(targetLang)}</small>
          </div>
        ) : null}
        {showTranslation ? (
          <div>
            <p className="sentence-translation">
              {translationAvailable ? sentence.translation_text : "Traduction indisponible"}
            </p>
            <small className="muted">{getLanguageLabel(translationLang)}</small>
          </div>
        ) : null}
      </section>
      {sentence.tags && (
        <footer className="player-footer">
          <small>Mots-clés : {sentence.tags}</small>
        </footer>
      )}
      {!translationAvailable && showTranslation ? (
        <p className="muted">
          Aucune traduction en {getLanguageLabel(translationLang)} pour cette phrase (langue
          d'origine : {getLanguageLabel(sentence.translation_lang)}).
        </p>
      ) : null}
    </article>
  );
}

export default Player;
