import { VoiceOption } from "../lib/speech";

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selectedVoiceURI: string | null;
  onSelect: (voiceURI: string | null) => void;
  disabled?: boolean;
}

export function VoiceSelector({ voices, selectedVoiceURI, onSelect, disabled }: VoiceSelectorProps) {
  const hasVoices = voices.length > 0;

  return (
    <div className="voice-selector">
      <label>
        Voix de synthèse :
        <select
          value={selectedVoiceURI ?? ""}
          onChange={(event) => onSelect(event.target.value || null)}
          disabled={disabled || !hasVoices}
        >
          {!hasVoices ? (
            <option value="">(aucune voix disponible)</option>
          ) : (
            <>
              <option value="">Par défaut du navigateur</option>
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} {voice.natural ? "🌟" : ""} ({voice.lang})
                </option>
              ))}
            </>
          )}
        </select>
      </label>
      <small className="muted">
        Les voix marquées 🌟 sont jugées plus naturelles (Google, Neural, WaveNet…).
      </small>
    </div>
  );
}

export default VoiceSelector;
