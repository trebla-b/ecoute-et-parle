import { useEffect, useMemo, useState } from "react";
import DiffView from "../components/DiffView";
import LanguageSelector from "../components/LanguageSelector";
import MicRecorder from "../components/MicRecorder";
import Player from "../components/Player";
import ToggleText from "../components/ToggleText";
import VoiceSelector from "../components/VoiceSelector";
import { api } from "../lib/api";
import { alignTexts } from "../lib/align";
import {
  DEFAULT_TARGET_LANG,
  DEFAULT_TRANSLATION_LANG,
  TARGET_LANGUAGES,
  TRANSLATION_LANGUAGES
} from "../lib/languages";
import {
  findBestVoice,
  listVoices,
  recordSpeech,
  speak,
  VoiceOption,
  isSpeechRecognitionSupported
} from "../lib/speech";
import { Attempt, DiffToken, Sentence } from "../lib/types";

const GOOD_THRESHOLD = 0.9;

export function PracticeView() {
  const [targetLang, setTargetLang] = useState(DEFAULT_TARGET_LANG);
  const [translationLang, setTranslationLang] = useState(DEFAULT_TRANSLATION_LANG);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);

  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSentenceText, setShowSentenceText] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [currentDiff, setCurrentDiff] = useState<DiffToken[]>([]);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<Attempt[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTarget = window.localStorage.getItem("practice.targetLang");
    const storedTranslation = window.localStorage.getItem("practice.translationLang");
    const storedVoice = window.localStorage.getItem("practice.voiceURI");
    if (storedTarget) setTargetLang(storedTarget);
    if (storedTranslation) setTranslationLang(storedTranslation);
    if (storedVoice) setSelectedVoiceURI(storedVoice);
  }, []);

  // Persist preferences
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("practice.targetLang", targetLang);
  }, [targetLang]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("practice.translationLang", translationLang);
  }, [translationLang]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedVoiceURI) {
      window.localStorage.setItem("practice.voiceURI", selectedVoiceURI);
    } else {
      window.localStorage.removeItem("practice.voiceURI");
    }
  }, [selectedVoiceURI]);

  // Load voices once
  useEffect(() => {
    listVoices()
      .then((loaded) => {
        setVoices(loaded);
      })
      .catch(() => setVoices([]));
  }, []);

  useEffect(() => {
    if (!voices.length) return;
    if (selectedVoiceURI) {
      const stillValid = voices.some(
        (voice) => voice.voiceURI === selectedVoiceURI && voice.lang.startsWith(targetLang.slice(0, 2))
      );
      if (stillValid) {
        return;
      }
    }
    const hints = TARGET_LANGUAGES.find((lang) => lang.code === targetLang)?.ttsHint ?? [];
    const best = findBestVoice(targetLang, hints);
    setSelectedVoiceURI(best?.voiceURI ?? null);
  }, [voices, targetLang, selectedVoiceURI]);

  // Fetch sentences when language changes
  useEffect(() => {
    setLoading(true);
    api
      .getSentences({ target_lang: targetLang, limit: 200 })
      .then((data) => {
        setSentences(data);
        setCurrentIndex(0);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement");
        setSentences([]);
      })
      .finally(() => setLoading(false));
  }, [targetLang]);

  const sentence = sentences[currentIndex] ?? null;

  useEffect(() => {
    if (!sentence) {
      setAttemptHistory([]);
      return;
    }
    api
      .getAttempts(sentence.id, targetLang)
      .then((results) => setAttemptHistory(results.reverse()))
      .catch(() => setAttemptHistory([]));
    setCurrentDiff([]);
    setCurrentScore(null);
    setStatus(null);
    setShowSentenceText(false);
  }, [sentence?.id, targetLang]);

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

  const micAvailable = useMemo(
    () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia,
    []
  );
  const webSpeechAvailable = useMemo(() => isSpeechRecognitionSupported(), []);

  const handlePlay = async () => {
    if (!sentence) return;
    try {
      await speak(sentence.sentence_text, { lang: targetLang, voiceURI: selectedVoiceURI });
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
      const result = await recordSpeech(8000, targetLang);
      const duration = Math.round(performance.now() - start);
      await processAttempt(sentence, result.transcript, duration);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Erreur d'enregistrement");
    } finally {
      setIsRecording(false);
    }
  };

  const processAttempt = async (refSentence: Sentence, transcript: string, duration: number) => {
    const alignment = alignTexts(refSentence.sentence_text, transcript);
    setCurrentDiff(alignment.diff);
    setCurrentScore(alignment.accuracy);

    const payload = {
      sentence_id: refSentence.id,
      target_lang: targetLang,
      asr_lang: targetLang,
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
      setStatus(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement de la tentative"
      );
    }
  };

  const handleNext = () => {
    if (!sentences.length) return;
    setCurrentIndex((prev) => (prev + 1) % sentences.length);
  };

  if (loading) {
    return <div className="card">Chargement…</div>;
  }

  if (error) {
    return <div className="card error">Erreur : {error}</div>;
  }

  return (
    <section>
      <div className="card preferences-card">
        <div className="preferences-grid">
          <LanguageSelector
            id="target-lang"
            label="Langue cible"
            options={TARGET_LANGUAGES}
            value={targetLang}
            onChange={setTargetLang}
          />
          <LanguageSelector
            id="translation-lang"
            label="Langue de traduction"
            options={TRANSLATION_LANGUAGES}
            value={translationLang}
            onChange={setTranslationLang}
          />
        </div>
        <VoiceSelector
          voices={voices.filter((voice) => voice.lang.startsWith(targetLang.slice(0, 2)))}
          selectedVoiceURI={selectedVoiceURI}
          onSelect={setSelectedVoiceURI}
        />
      </div>

      <Player
        sentence={sentence}
        showSentenceText={showSentenceText}
        showTranslation={showTranslation}
        onPlay={handlePlay}
        targetLang={targetLang}
        translationLang={translationLang}
      />

      <div className="card practice-controls">
        <div className="practice-buttons">
          <button type="button" onClick={handleNext} disabled={!sentences.length}>
            ➡️ Phrase suivante
          </button>
          <ToggleText
            label="Afficher la phrase"
            toggledLabel="Masquer la phrase"
            active={showSentenceText}
            onToggle={() => setShowSentenceText((value) => !value)}
          />
          <ToggleText
            label="Afficher la traduction"
            toggledLabel="Masquer la traduction"
            active={showTranslation}
            onToggle={() => setShowTranslation((value) => !value)}
          />
        </div>
        <MicRecorder onRecord={handleRecord} isRecording={isRecording} disabled={!micAvailable} />
        {!micAvailable ? (
          <p className="muted">
            Microphone indisponible. Veuillez autoriser l'accès ou connecter un micro.
          </p>
        ) : null}
        {!webSpeechAvailable ? (
          <p className="muted">
            Ce navigateur ne supporte pas la Web Speech API. Veuillez utiliser Google Chrome pour la
            reconnaissance vocale.
          </p>
        ) : null}
      </div>

      <div className="card result-card" aria-live="polite">
        <header className="result-header">
          <h2>Résultat</h2>
        </header>
        {currentScore !== null ? (
          <span className={`badge ${currentScore >= GOOD_THRESHOLD ? "good" : "bad"}`}>
            {Math.round(currentScore * 100)} %
          </span>
        ) : null}
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
                <span className="muted">{attempt.asr_lang}</span>
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
