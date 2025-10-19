export type Difficulty = "easy" | "medium" | "hard";

export interface DiffToken {
  op: "match" | "sub" | "del" | "ins";
  ref?: string | null;
  hyp?: string | null;
}

export interface Sentence {
  id: string;
  fr_text: string;
  en_text?: string | null;
  difficulty: Difficulty;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface SentenceCreate {
  fr_text: string;
  en_text?: string | null;
  difficulty?: Difficulty;
  tags?: string;
}

export interface Attempt {
  id: string;
  sentence_id: string;
  asr_text: string;
  score: number;
  words_total: number;
  words_correct: number;
  diff_json: DiffToken[];
  duration_ms: number;
  created_at: string;
}

export interface AttemptCreate {
  sentence_id: string;
  asr_text: string;
  score: number;
  words_total: number;
  words_correct: number;
  diff_json: DiffToken[];
  duration_ms: number;
}
