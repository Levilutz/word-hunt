from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

Grid = list[list[str | None]]


class Point(BaseModel):
    x: int
    y: int


class VersusGamesMatchQueueItem(BaseModel):
    id: UUID
    session_id: UUID
    join_time: datetime
    game_id: UUID | None
    other_session_id: UUID | None
    match_time: datetime | None


class VersusGame(BaseModel):
    id: UUID
    created_at: datetime
    session_a_id: UUID
    session_a_start: datetime | None
    session_a_done: bool
    session_b_id: UUID
    session_b_start: datetime | None
    session_b_done: bool
    grid: Grid


class VersusGameSubmittedWord(BaseModel):
    id: UUID
    game_id: UUID
    session_id: UUID
    tile_path: list[Point]
    word: str
