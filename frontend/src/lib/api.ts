import { Attempt, AttemptCreate, Sentence, SentenceCreate } from "./types";

const API_BASE = "/api";

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export interface SentenceQuery {
  limit?: number;
  offset?: number;
  difficulty?: string;
  search?: string;
  target_lang?: string;
  translation_lang?: string;
}

export const api = {
  async getSentences(params: SentenceQuery = {}): Promise<Sentence[]> {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        search.set(key, String(value));
      }
    });
    const suffix = search.toString() ? `?${search}` : "";
    return request<Sentence[]>(`${API_BASE}/sentences${suffix}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
  },

  async createSentence(payload: SentenceCreate): Promise<Sentence> {
    return request<Sentence>(`${API_BASE}/sentences`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async updateSentence(id: string, payload: Partial<SentenceCreate>): Promise<Sentence> {
    return request<Sentence>(`${API_BASE}/sentences/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },

  async deleteSentence(id: string): Promise<void> {
    await request<void>(`${API_BASE}/sentences/${id}`, { method: "DELETE" });
  },

  async getAttempts(sentenceId?: string, targetLang?: string): Promise<Attempt[]> {
    const search = new URLSearchParams();
    if (sentenceId) search.set("sentence_id", sentenceId);
    if (targetLang) search.set("target_lang", targetLang);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<Attempt[]>(`${API_BASE}/attempts${suffix}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
  },

  async createAttempt(payload: AttemptCreate): Promise<Attempt> {
    return request<Attempt>(`${API_BASE}/attempts`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async importSentences(file: File): Promise<{ imported: number }> {
    const form = new FormData();
    form.append("file", file, file.name);
    const response = await fetch(`${API_BASE}/import/sentences`, {
      method: "POST",
      body: form
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || response.statusText);
    }
    return response.json();
  },

  async exportSentences(): Promise<Blob> {
    const response = await fetch(`${API_BASE}/export/sentences`);
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || response.statusText);
    }
    return response.blob();
  }
};
