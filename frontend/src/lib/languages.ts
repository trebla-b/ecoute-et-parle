export interface LanguageOption {
  code: string;
  label: string;
  ttsHint?: string[];
}

export const DEFAULT_TARGET_LANG = "fr-FR";
export const DEFAULT_TRANSLATION_LANG = "zh-CN";

export const TARGET_LANGUAGES: LanguageOption[] = [
  { code: "fr-FR", label: "Français (France)", ttsHint: ["Google français", "Thomas"] },
  { code: "en-US", label: "English (US)", ttsHint: ["Google US English", "Samantha"] },
  { code: "es-ES", label: "Español (España)", ttsHint: ["Google español"] },
  { code: "de-DE", label: "Deutsch", ttsHint: ["Google Deutsch"] }
];

export const TRANSLATION_LANGUAGES: LanguageOption[] = [
  { code: "zh-CN", label: "中文（简体）" },
  { code: "en-US", label: "English (US)" },
  { code: "fr-FR", label: "Français (France)" },
  { code: "es-ES", label: "Español (España)" }
];

export function getLanguageLabel(code: string, fallback = code): string {
  const option =
    TARGET_LANGUAGES.find((lang) => lang.code === code) ??
    TRANSLATION_LANGUAGES.find((lang) => lang.code === code);
  return option?.label ?? fallback;
}
