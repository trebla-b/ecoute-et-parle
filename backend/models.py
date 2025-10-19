from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, validator


Difficulty = Literal["easy", "medium", "hard"]


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


class SentenceBase(BaseModel):
    sentence_text: str = Field(..., min_length=1)
    target_lang: str = Field(default="fr-FR", min_length=2)
    translation_text: Optional[str] = None
    translation_lang: str = Field(default="zh-CN", min_length=2)
    difficulty: Optional[Difficulty] = "medium"
    tags: Optional[str] = ""


class SentenceCreate(SentenceBase):
    pass


class SentenceUpdate(BaseModel):
    sentence_text: Optional[str] = None
    target_lang: Optional[str] = None
    translation_text: Optional[str] = None
    translation_lang: Optional[str] = None
    difficulty: Optional[Difficulty] = None
    tags: Optional[str] = None


class Sentence(SentenceBase):
    id: str
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class DiffToken(BaseModel):
    op: Literal["match", "sub", "del", "ins"]
    ref: Optional[str] = None
    hyp: Optional[str] = None


class AttemptBase(BaseModel):
    sentence_id: str
    asr_text: str
    target_lang: str = Field(default="fr-FR", min_length=2)
    asr_lang: str = Field(default="fr-FR", min_length=2)
    score: float
    words_total: int
    words_correct: int
    diff_json: List[DiffToken]
    duration_ms: int

    @validator("words_total", "words_correct", "duration_ms")
    def positive_ints(cls, value: int) -> int:
        if value < 0:
            raise ValueError("Value must be non-negative")
        return value

    @validator("score")
    def score_range(cls, value: float) -> float:
        if not 0 <= value <= 1:
            raise ValueError("Score must be between 0 and 1")
        return value


class AttemptCreate(AttemptBase):
    pass


class Attempt(AttemptBase):
    id: str
    created_at: str = Field(default_factory=now_iso)
