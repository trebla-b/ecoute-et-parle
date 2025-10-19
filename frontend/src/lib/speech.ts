export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
}

export interface RecordResult {
  transcript: string;
  confidence: number;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const globalAny = window as typeof window & {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return (
    globalAny.SpeechRecognition ||
    globalAny.webkitSpeechRecognition ||
    null
  );
}

export function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.reject(new Error("Speech synthesis is not supported in this browser"));
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang ?? "fr-FR";
  if (options.rate) utterance.rate = options.rate;
  if (options.pitch) utterance.pitch = options.pitch;

  return new Promise((resolve) => {
    utterance.onend = () => resolve();
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  });
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== "undefined" && getSpeechRecognition() !== null;
}

export function recordSpeech(timeoutMs = 8000, lang = "fr-FR"): Promise<RecordResult> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Speech recognition only works in the browser"));
  }

  const Recognition = getSpeechRecognition();
  if (!Recognition) {
    return Promise.reject(new Error("Speech recognition is not available in this browser"));
  }

  const recognition = new Recognition();
  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  return new Promise<RecordResult>((resolve, reject) => {
    let timer: number | null = null;

    recognition.onresult = (event) => {
      const result = event.results[0]?.[0];
      if (!result) {
        reject(new Error("No speech detected"));
      } else {
        resolve({
          transcript: result.transcript,
          confidence: result.confidence ?? 0
        });
      }
      recognition.stop();
      if (timer) window.clearTimeout(timer);
    };

    recognition.onerror = (event) => {
      if (timer) window.clearTimeout(timer);
      recognition.stop();
      reject(new Error(event.error));
    };

    recognition.onend = () => {
      if (timer) window.clearTimeout(timer);
    };

    recognition.start();
    if (timeoutMs > 0) {
      timer = window.setTimeout(() => {
        recognition.stop();
        reject(new Error("Speech timeout"));
      }, timeoutMs);
    }
  });
}
