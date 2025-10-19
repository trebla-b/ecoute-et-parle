from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, validator


Difficulty = Literal["easy", "medium", "hard"]


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


class SentenceBase(BaseModel):
    fr_text: str = Field(..., min_length=1)
    en_text: Optional[str] = None
    difficulty: Optional[Difficulty] = "medium"
    tags: Optional[str] = ""


class SentenceCreate(SentenceBase):
    pass


class SentenceUpdate(BaseModel):
    fr_text: Optional[str] = None
    en_text: Optional[str] = None
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
