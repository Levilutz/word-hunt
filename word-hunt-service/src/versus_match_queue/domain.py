from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class VersusQueueMatch:
    """This session has matched, and has a game id assigned."""

    game_id: UUID
    matched_player_session_id: UUID
    must_create_game: bool
