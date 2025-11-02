from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

Grid = list[list[str | None]]


class Point(BaseModel):
    x: int
    y: int


class VersusGame(BaseModel):
    id: UUID
    created_at: datetime
    player_a_session_id: UUID
    player_a_start: datetime | None
    player_a_done: bool
    player_b_session_id: UUID
    player_b_start: datetime | None
    player_b_done: bool
    grid: Grid


class VersusGameSubmittedWord(BaseModel):
    id: UUID
    game_id: UUID
    by_session_id: UUID
    tile_path: list[Point]
    word: str
