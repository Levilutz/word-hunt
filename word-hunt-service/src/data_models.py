from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from src.core import GameMode, Grid


class Game(BaseModel):
    id: UUID
    created_at: datetime
    creator_id: UUID
    competitor_id: UUID | None
    game_mode: GameMode
    grid: Grid
    start_time: datetime | None
    end_time: datetime | None
