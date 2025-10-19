interface ToggleTextProps {
  label: string;
  toggledLabel?: string;
  active: boolean;
  onToggle: () => void;
}

export function ToggleText({ label, toggledLabel, active, onToggle }: ToggleTextProps) {
  return (
    <button
      type="button"
      className={`toggle-button ${active ? "active" : ""}`}
      onClick={onToggle}
    >
      {active ? toggledLabel ?? label : label}
    </button>
  );
}

export default ToggleText;
