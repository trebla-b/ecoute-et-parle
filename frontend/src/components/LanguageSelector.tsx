import { LanguageOption } from "../lib/languages";

interface LanguageSelectorProps {
  id: string;
  label: string;
  options: LanguageOption[];
  value: string;
  onChange: (code: string) => void;
}

export function LanguageSelector({ id, label, options, value, onChange }: LanguageSelectorProps) {
  return (
    <label className="language-selector" htmlFor={id}>
      {label}
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default LanguageSelector;
