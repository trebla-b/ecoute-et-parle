import { ensureRecognizer, releaseRecognizer } from "./vosk";

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  voiceURI?: string | null;
}

export interface RecordResult {
  transcript: string;
  confidence: number;
  engine: "web-speech" | "vosk";
}

export interface VoiceOption {
  name: string;
  voiceURI: string;
  lang: string;
  natural: boolean;
  default: boolean;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

let voiceCache: VoiceOption[] = [];
let voicesLoaded = false;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const globalAny = window as typeof window & {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return (
    globalAny.SpeechRecognition ||
    globalAny.webkitSpeechRecognition ||
    null
  );
}

function mapVoice(voice: SpeechSynthesisVoice): VoiceOption {
  const naturalKeywords = ["google", "wavenet", "neural", "premium", "enhanced"];
  const lowerName = voice.name.toLowerCase();
  const natural = naturalKeywords.some((keyword) => lowerName.includes(keyword));
  return {
    name: voice.name,
    voiceURI: voice.voiceURI,
    lang: voice.lang,
    natural,
    default: voice.default
  };
}

export async function listVoices(): Promise<VoiceOption[]> {
  if (voiceCache.length && voicesLoaded) {
    return voiceCache;
  }
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    voicesLoaded = true;
    voiceCache = [];
    return voiceCache;
  }

  const synth = window.speechSynthesis;
  const load = () =>
    new Promise<VoiceOption[]>((resolve) => {
      const voices = synth.getVoices();
      if (voices.length) {
        resolve(voices.map(mapVoice));
      } else {
        synth.addEventListener(
          "voiceschanged",
          () => {
            resolve(synth.getVoices().map(mapVoice));
          },
          { once: true }
        );
      }
    });

  voiceCache = await load();
  voicesLoaded = true;
  return voiceCache;
}

export function findBestVoice(lang: string, hints: string[] = []): VoiceOption | null {
  if (!voiceCache.length) return null;
  const candidates = voiceCache.filter((voice) => voice.lang.startsWith(lang.slice(0, 2)));
  if (!candidates.length) {
    return voiceCache[0] ?? null;
  }

  const normalizedHints = hints.map((hint) => hint.toLowerCase());
  const hinted = candidates.find((voice) =>
    normalizedHints.some((hint) => voice.name.toLowerCase().includes(hint))
  );
  if (hinted) return hinted;

  const natural = candidates.find((voice) => voice.natural);
  if (natural) return natural;

  const exact = candidates.find((voice) => voice.lang === lang);
  if (exact) return exact;

  return candidates[0];
}

export async function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    throw new Error("Speech synthesis is not supported in this browser");
  }
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang ?? "fr-FR";
  if (options.rate) utterance.rate = options.rate;
  if (options.pitch) utterance.pitch = options.pitch;
  if (options.voiceURI) {
    const voices = synth.getVoices();
    const found = voices.find((voice) => voice.voiceURI === options.voiceURI);
    if (found) {
      utterance.voice = found;
    }
  }

  return new Promise((resolve, reject) => {
    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(event.error ?? new Error("Speech synthesis error"));
    synth.cancel();
    synth.speak(utterance);
  });
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== "undefined" && getSpeechRecognition() !== null;
}

export async function recordSpeech(timeoutMs = 8000, lang = "fr-FR"): Promise<RecordResult> {
  if (typeof window === "undefined") {
    throw new Error("Speech recognition only works in the browser");
  }

  const Recognition = getSpeechRecognition();
  if (Recognition) {
    try {
      return await recordWithWebSpeech(Recognition, timeoutMs, lang);
    } catch (error) {
      console.warn("Web Speech API failed, falling back to Vosk:", error);
    }
  }

  return recordWithVosk(timeoutMs, lang);
}

async function recordWithWebSpeech(
  Recognition: SpeechRecognitionConstructor,
  timeoutMs: number,
  lang: string
): Promise<RecordResult> {
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
          confidence: result.confidence ?? 0.8,
          engine: "web-speech"
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

async function recordWithVosk(timeoutMs: number, lang: string): Promise<RecordResult> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone access is not available in this browser");
  }
  if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined") {
    throw new Error("MediaRecorder API is not supported in this browser");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const sampleRate = 16000;
  let recognizer: any;
  try {
    ({ recognizer } = await ensureRecognizer(lang, sampleRate));
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error(
      `Vosk fallback unavailable for ${lang}. Place a model under /public/vosk/<lang> (see README).`
    );
  }

  const mediaRecorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];

  mediaRecorder.addEventListener("dataavailable", (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  const recording = new Promise<Blob>((resolve, reject) => {
    mediaRecorder.addEventListener("stop", () => {
      resolve(new Blob(chunks, { type: mediaRecorder.mimeType }));
    });
    mediaRecorder.addEventListener("error", (event) => {
      reject(event.error);
    });
  });

  mediaRecorder.start();
  const stopTimer = window.setTimeout(() => {
    if (mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
  }, timeoutMs);

  const audioBlob = await recording;
  window.clearTimeout(stopTimer);
  stream.getTracks().forEach((track) => track.stop());

  const transcript = await transcribeBlobWithVosk(audioBlob, recognizer, sampleRate, lang);
  const confidence = transcript ? 0.75 : 0;

  return { transcript, confidence, engine: "vosk" };
}

async function transcribeBlobWithVosk(
  blob: Blob,
  recognizer: any,
  sampleRate: number,
  lang: string
): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  const monoData = mixToMono(audioBuffer);
  const resampled = resampleBuffer(monoData, audioBuffer.sampleRate, sampleRate);
  await audioContext.close();

  const chunkSize = 4096;
  for (let i = 0; i < resampled.length; i += chunkSize) {
    const chunk = resampled.subarray(i, i + chunkSize);
    recognizer.acceptWaveform(chunk);
  }
  const finalResult = recognizer.finalResult();
  if (!finalResult) return "";
  try {
    const parsed = typeof finalResult === "string" ? JSON.parse(finalResult) : finalResult;
    if (parsed?.text) {
      return parsed.text;
    }
    if (Array.isArray(parsed?.result) && parsed.result.length) {
      return parsed.result.map((item: { word: string }) => item.word).join(" ");
    }
  } catch {
    // ignore parse errors
  } finally {
    await releaseRecognizer(lang);
  }
  if (typeof finalResult === "string") {
    return finalResult;
  }
  return "";
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) {
    return buffer.getChannelData(0);
  }
  const output = new Float32Array(buffer.length);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < channelData.length; i++) {
      output[i] += channelData[i] / buffer.numberOfChannels;
    }
  }
  return output;
}

function resampleBuffer(
  data: Float32Array,
  sourceRate: number,
  targetRate: number
): Float32Array {
  if (sourceRate === targetRate) {
    return new Float32Array(data);
  }
  const ratio = sourceRate / targetRate;
  const newLength = Math.round(data.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const index = i * ratio;
    const leftIndex = Math.floor(index);
    const rightIndex = Math.min(data.length - 1, leftIndex + 1);
    const interp = index - leftIndex;
    result[i] = data[leftIndex] * (1 - interp) + data[rightIndex] * interp;
  }
  return result;
}
