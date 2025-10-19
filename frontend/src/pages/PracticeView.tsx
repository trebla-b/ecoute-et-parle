import { useEffect, useMemo, useState } from "react";
import DiffView from "../components/DiffView";
import MicRecorder from "../components/MicRecorder";
import Player from "../components/Player";
import ToggleText from "../components/ToggleText";
import { api } from "../lib/api";
import { alignTexts } from "../lib/align";
import { isSpeechRecognitionSupported, recordSpeech, speak } from "../lib/speech";
import { Attempt, DiffToken, Sentence } from "../lib/types";

const GOOD_THRESHOLD = 0.9;

export function PracticeView() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFrench, setShowFrench] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentDiff, setCurrentDiff] = useState<DiffToken[]>([]);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<Attempt[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchSentences = async () => {
      try {
        const data = await api.getSentences({ limit: 200 });
        setSentences(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };
    fetchSentences();
  }, []);

  const sentence = sentences[currentIndex] ?? null;

  useEffect(() => {
    if (sentence) {
      api
        .getAttempts(sentence.id)
        .then((results) => setAttemptHistory(results.reverse()))
        .catch(() => setAttemptHistory([]));
      setCurrentDiff([]);
      setCurrentScore(null);
      setStatus(null);
      setShowFrench(false);
      setShowEnglish(false);
    }
  }, [sentence?.id]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        handlePlay();
      } else if (event.code === "KeyM") {
        event.preventDefault();
        if (!isRecording) handleRecord();
      } else if (event.code === "KeyR") {
        event.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  const handlePlay = async () => {
    if (!sentence) return;
    try {
      await speak(sentence.fr_text);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Impossible de lire la phrase");
    }
  };

  const handleRecord = async () => {
    if (!sentence) return;
    setIsRecording(true);
    setStatus(null);
    const start = performance.now();

    try {
      const result = await recordSpeech(8000, "fr-FR");
      const duration = Math.round(performance.now() - start);
      processAttempt(sentence, result.transcript, duration);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Erreur d'enregistrement");
    } finally {
      setIsRecording(false);
    }
  };

  const processAttempt = async (refSentence: Sentence, transcript: string, duration: number) => {
    const alignment = alignTexts(refSentence.fr_text, transcript);
    setCurrentDiff(alignment.diff);
    setCurrentScore(alignment.accuracy);

    const payload = {
      sentence_id: refSentence.id,
      asr_text: transcript,
      score: alignment.accuracy >= GOOD_THRESHOLD ? 1 : 0,
      words_total: alignment.wordsTotal,
      words_correct: alignment.wordsCorrect,
      diff_json: alignment.diff,
      duration_ms: duration
    };

    try {
      const attempt = await api.createAttempt(payload);
      setAttemptHistory((prev) => [attempt, ...prev]);
      setStatus(
        payload.score
          ? "Bravo ! Votre prononciation est excellente."
          : "Continuez ! Réessayez pour améliorer la prononciation."
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de la tentative");
    }
  };

  const handleNext = () => {
    if (!sentences.length) return;
    setCurrentIndex((prev) => (prev + 1) % sentences.length);
  };

  const recognitionSupported = useMemo(() => isSpeechRecognitionSupported(), []);

  if (loading) {
    return <div className="card">Chargement…</div>;
  }

  if (error) {
    return <div className="card error">Erreur : {error}</div>;
  }

  return (
    <section>
      <Player
        sentence={sentence}
        showFrench={showFrench}
        showEnglish={showEnglish}
        onPlay={handlePlay}
      />

      <div className="card practice-controls">
        <div className="practice-buttons">
          <button type="button" onClick={handleNext} disabled={!sentences.length}>
            ➡️ Phrase suivante
          </button>
          <ToggleText
            label="Afficher le français"
            toggledLabel="Masquer le français"
            active={showFrench}
            onToggle={() => setShowFrench((value) => !value)}
          />
          <ToggleText
            label="Afficher la traduction"
            toggledLabel="Masquer la traduction"
            active={showEnglish}
            onToggle={() => setShowEnglish((value) => !value)}
          />
        </div>
        <MicRecorder
          onRecord={handleRecord}
          isRecording={isRecording}
          disabled={!recognitionSupported}
        />
        {!recognitionSupported ? (
          <p className="muted">
            La reconnaissance vocale n'est pas supportée par ce navigateur. Veuillez utiliser Chrome
            ou charger un module Vosk.
          </p>
        ) : null}
      </div>

      <div className="card result-card" aria-live="polite">
        <header className="result-header">
          <h2>Résultat</h2>
          {currentScore !== null ? (
            <span className={`badge ${currentScore >= GOOD_THRESHOLD ? "good" : "bad"}`}>
              {Math.round(currentScore * 100)} %
            </span>
          ) : null}
        </header>
        <DiffView diff={currentDiff} />
        {status ? <p className="status-message">{status}</p> : null}
      </div>

      <div className="card attempts-card">
        <header>
          <h2>Historique des tentatives</h2>
        </header>
        {attemptHistory.length === 0 ? (
          <p className="muted">Parlez pour enregistrer votre première tentative.</p>
        ) : (
          <ul className="attempt-list">
            {attemptHistory.map((attempt) => (
              <li key={attempt.id}>
                <span>{new Date(attempt.created_at).toLocaleTimeString()}</span>
                <span className={`badge ${attempt.score ? "good" : "bad"}`}>
                  {attempt.score ? "Réussi" : "À retravailler"}
                </span>
                <span className="attempt-text">{attempt.asr_text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default PracticeView;
