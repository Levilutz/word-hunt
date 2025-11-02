from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class VersusGamesMatchQueueEntry(BaseModel):
    id: UUID
    queued_player_session_id: UUID
    join_time: datetime
    game_id: UUID | None
    matched_player_session_id: UUID | None
    match_time: datetime | None
