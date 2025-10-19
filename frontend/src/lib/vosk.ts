/**
 * Lightweight helper around the vosk-browser package.
 * The user must provide the appropriate model files in /public/vosk/<lang>.
 */

type VoskModule = typeof import("vosk-browser");
type Model = any;
type Recognizer = any;

const recognizerCache = new Map<string, Promise<{ model: Model; recognizer: Recognizer }>>();
let voskModulePromise: Promise<VoskModule> | null = null;

const MODEL_PATHS: Record<string, string> = {
  "fr-FR": "/vosk/fr",
  "en-US": "/vosk/en",
  "es-ES": "/vosk/es",
  "de-DE": "/vosk/de"
};

async function loadModule(): Promise<VoskModule> {
  if (!voskModulePromise) {
    voskModulePromise = import("vosk-browser").then(async (mod) => {
      if ("setLogLevel" in mod) {
        mod.setLogLevel(-1);
      }
      if ("init" in mod) {
        await mod.init();
      }
      return mod;
    });
  }
  return voskModulePromise;
}

export async function ensureRecognizer(
  lang: string,
  sampleRate: number
): Promise<{ recognizer: Recognizer; model: Model }> {
  const langKey = lang.toLowerCase();
  const cached = recognizerCache.get(langKey);
  if (cached) {
    return cached;
  }

  const loadPromise = (async () => {
    const module = await loadModule();
    const langRoot = lang.split("-")[0];
    const basePath =
      MODEL_PATHS[lang] ?? MODEL_PATHS[langRoot] ?? MODEL_PATHS[`${langRoot}-FR`] ?? null;
    if (!basePath) {
      throw new Error(`No Vosk model configured for language ${lang}`);
    }
    const model = new module.Model(basePath);
    const recognizer = new module.Recognizer({ model, sampleRate });
    return { model, recognizer };
  })();

  recognizerCache.set(langKey, loadPromise);
  return loadPromise;
}

export async function releaseRecognizer(lang: string): Promise<void> {
  const key = lang.toLowerCase();
  const cached = recognizerCache.get(key);
  if (!cached) return;
  try {
    const { recognizer, model } = await cached;
    recognizer.free();
    model.free();
  } catch {
    // ignore
  } finally {
    recognizerCache.delete(key);
  }
}
