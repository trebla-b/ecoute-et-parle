import { DiffToken } from "../lib/types";

interface DiffViewProps {
  diff: DiffToken[];
}

const TOKEN_LABEL: Record<DiffToken["op"], string> = {
  match: "Correct",
  sub: "Remplacement",
  del: "Omission",
  ins: "Ajout"
};

export function DiffView({ diff }: DiffViewProps) {
  if (!diff.length) {
    return <p className="muted">Pas encore d'analyse.</p>;
  }

  return (
    <div className="diff-container">
      {diff.map((token, index) => {
        const key = `${index}-${token.op}-${token.ref ?? ""}-${token.hyp ?? ""}`;
        const display = token.op === "ins" ? token.hyp : token.ref;
        return (
          <span
            key={key}
            className={`diff-token ${token.op}`}
            aria-label={`${TOKEN_LABEL[token.op]}: ${display ?? ""}`}
          >
            {display}
          </span>
        );
      })}
    </div>
  );
}

export default DiffView;
