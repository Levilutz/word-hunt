from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class VersusGamesMatchQueueItem(BaseModel):
    id: UUID
    session_id: UUID
    join_time: datetime
    game_id: UUID | None
    other_session_id: UUID | None
    match_time: datetime | None
