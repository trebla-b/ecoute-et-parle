export type Difficulty = "easy" | "medium" | "hard";

export interface DiffToken {
  op: "match" | "sub" | "del" | "ins";
  ref?: string | null;
  hyp?: string | null;
}

export interface Sentence {
  id: string;
  target_lang: string;
  sentence_text: string;
  translation_lang: string;
  translation_text?: string | null;
  difficulty: Difficulty;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface SentenceCreate {
  sentence_text: string;
  target_lang: string;
  translation_text?: string | null;
  translation_lang: string;
  difficulty?: Difficulty;
  tags?: string;
}

export interface Attempt {
  id: string;
  sentence_id: string;
  target_lang: string;
  asr_lang: string;
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
  target_lang: string;
  asr_lang: string;
  asr_text: string;
  score: number;
  words_total: number;
  words_correct: number;
  diff_json: DiffToken[];
  duration_ms: number;
}
