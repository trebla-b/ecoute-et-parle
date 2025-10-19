interface MicRecorderProps {
  onRecord: () => void;
  isRecording: boolean;
  disabled?: boolean;
}

export function MicRecorder({ onRecord, isRecording, disabled }: MicRecorderProps) {
  return (
    <button
      type="button"
      className={`mic-button ${isRecording ? "recording" : ""}`}
      onClick={onRecord}
      disabled={disabled || isRecording}
      aria-pressed={isRecording}
    >
      {isRecording ? "Enregistrement…" : "🎤 Parler"}
    </button>
  );
}

export default MicRecorder;
