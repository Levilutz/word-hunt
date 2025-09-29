from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from src.core import GameMode, Grid, Point


class Game(BaseModel):
    id: UUID
    created_at: datetime
    creator_id: UUID
    competitor_id: UUID | None
    game_mode: GameMode
    grid: Grid
    start_time: datetime | None
    end_time: datetime | None


class GameSubmittedWord(BaseModel):
    id: UUID
    game_id: UUID
    submitter_id: UUID
    tile_path: list[Point]
    word: str
