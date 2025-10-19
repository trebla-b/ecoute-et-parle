import { DiffToken } from "./types";

export interface AlignmentResult {
  diff: DiffToken[];
  wordsTotal: number;
  wordsCorrect: number;
  accuracy: number;
  referenceTokens: string[];
  hypothesisTokens: string[];
}

const PUNCT_REGEX = /[.,?!;:()[\]{}"“”«»]/g;
const APOSTROPHE_MAP: Record<string, string> = {
  l: "le",
  j: "je",
  t: "te",
  s: "se",
  d: "de",
  c: "ce",
  m: "me",
  n: "ne",
  qu: "que",
  lorsqu: "lorsque",
  puisqu: "puisque",
  jusqu: "jusque"
};

export function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: string): string[] {
  const normalized = normalizeText(value)
    .replace(PUNCT_REGEX, " ")
    .replace(/-/g, " ");

  const rawParts = normalized.split(/\s+/);
  const tokens: string[] = [];
  for (const part of rawParts) {
    if (!part) continue;
    tokens.push(...splitApostrophes(part));
  }
  return tokens.filter(Boolean);
}

function splitApostrophes(token: string): string[] {
  if (!token.includes("'")) {
    return [token];
  }

  const [prefix, rest] = token.split("'", 2);
  if (!rest) {
    return [token.replace("'", "")];
  }

  const mappedPrefix = APOSTROPHE_MAP[prefix] ?? prefix;
  return [mappedPrefix, ...splitApostrophes(rest)];
}

export function alignTexts(reference: string, hypothesis: string): AlignmentResult {
  const refTokens = tokenize(reference);
  const hypTokens = tokenize(hypothesis);
  const rows = refTokens.length + 1;
  const cols = hypTokens.length + 1;

  const dp: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  const backtrack: ("diag" | "up" | "left")[][] = Array.from({ length: rows }, () =>
    Array(cols).fill("diag")
  );

  for (let i = 0; i < rows; i++) {
    dp[i][0] = i;
    if (i > 0) backtrack[i][0] = "up";
  }
  for (let j = 0; j < cols; j++) {
    dp[0][j] = j;
    if (j > 0) backtrack[0][j] = "left";
  }

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const costSub = dp[i - 1][j - 1] + (refTokens[i - 1] === hypTokens[j - 1] ? 0 : 1);
      const costDel = dp[i - 1][j] + 1;
      const costIns = dp[i][j - 1] + 1;

      let cost = costSub;
      let choice: "diag" | "up" | "left" = "diag";

      if (costDel < cost) {
        cost = costDel;
        choice = "up";
      }
      if (costIns < cost) {
        cost = costIns;
        choice = "left";
      }

      dp[i][j] = cost;
      backtrack[i][j] = choice;
    }
  }

  const diff: DiffToken[] = [];
  let i = refTokens.length;
  let j = hypTokens.length;
  let matches = 0;

  while (i > 0 || j > 0) {
    const move = backtrack[i][j];
    if (i > 0 && j > 0 && move === "diag") {
      if (refTokens[i - 1] === hypTokens[j - 1]) {
        diff.push({ op: "match", ref: refTokens[i - 1], hyp: hypTokens[j - 1] });
        matches += 1;
      } else {
        diff.push({ op: "sub", ref: refTokens[i - 1], hyp: hypTokens[j - 1] });
      }
      i -= 1;
      j -= 1;
    } else if (i > 0 && (j === 0 || move === "up")) {
      diff.push({ op: "del", ref: refTokens[i - 1], hyp: null });
      i -= 1;
    } else if (j > 0) {
      diff.push({ op: "ins", ref: null, hyp: hypTokens[j - 1] });
      j -= 1;
    }
  }

  diff.reverse();
  const total = refTokens.length || 1;
  const accuracy = matches / total;

  return {
    diff,
    wordsTotal: refTokens.length,
    wordsCorrect: matches,
    accuracy,
    referenceTokens: refTokens,
    hypothesisTokens: hypTokens
  };
}
