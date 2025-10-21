from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from src.core import Grid, Point


@dataclass
class VersusGameSubmittedWord:
    submitted_word_id: UUID
    tile_path: list[Point]
    word: str

    @staticmethod
    def dedup(
        words: list[VersusGameSubmittedWord],
    ) -> list[VersusGameSubmittedWord]:
        deduped = {word.word: word for word in words}
        return list(deduped.values())


@dataclass
class VersusGameSession:
    session_id: UUID
    start: datetime | None
    done: bool
    submitted_words: list[VersusGameSubmittedWord]


@dataclass
class VersusGame:
    game_id: UUID
    created_at: datetime
    session_a: VersusGameSession
    session_b: VersusGameSession
    grid: Grid
