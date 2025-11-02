from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import datetime
from typing import Literal
from uuid import UUID

from src import utils
from src.versus_game.constants import (
    GAME_AUTO_END_SECS,
    GAME_DURATION_SECS,
    POINTS_BY_LEN,
)

Grid = list[list[str | None]]
GridTemplate = list[list[bool]]

GridTemplateName = Literal["standard", "o", "x", "big"]

GRID_TEMPLATES: dict[GridTemplateName, GridTemplate] = {
    "standard": [
        [True, True, True, True],
        [True, True, True, True],
        [True, True, True, True],
        [True, True, True, True],
    ],
    "o": [
        [False, True, True, True, False],
        [True, True, True, True, True],
        [True, True, False, True, True],
        [True, True, True, True, True],
        [False, True, True, True, False],
    ],
    "x": [
        [True, True, False, True, True],
        [True, True, True, True, True],
        [False, True, True, True, False],
        [True, True, True, True, True],
        [True, True, False, True, True],
    ],
    "big": [
        [True, True, True, True, True],
        [True, True, True, True, True],
        [True, True, True, True, True],
        [True, True, True, True, True],
        [True, True, True, True, True],
    ],
}


@dataclass(frozen=True)
class Point:
    x: int
    y: int


@dataclass(frozen=True)
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

    def points(self) -> int:
        return POINTS_BY_LEN.get(len(self.word), 0)


@dataclass(frozen=True)
class VersusGameSession:
    session_id: UUID
    start: datetime | None
    done: bool
    submitted_words: list[VersusGameSubmittedWord]

    def play_secs_remaining(self) -> float | None:
        """How many seconds this player has left, per their self-declared start time."""
        if self.start is None:
            return None
        if self.done:
            return 0
        return max(GAME_DURATION_SECS - utils.elapsed_secs(self.start), 0)

    def points(self) -> int:
        return sum(word.points() for word in self.submitted_words)


@dataclass(frozen=True)
class OrientedSessions:
    """Sessions oriented as "this session" and "the other session", given context."""

    this_session: VersusGameSession
    other_session: VersusGameSession


@dataclass(frozen=True)
class VersusGame:
    game_id: UUID
    created_at: datetime
    session_a: VersusGameSession
    session_b: VersusGameSession
    grid: Grid

    def get_oriented_sessions(self, session_id: UUID) -> OrientedSessions | None:
        """Get a the sessions oriented by context."""
        if session_id == self.session_a.session_id:
            return OrientedSessions(
                this_session=self.session_a, other_session=self.session_b
            )
        if session_id == self.session_b.session_id:
            return OrientedSessions(
                this_session=self.session_b, other_session=self.session_a
            )
        return None

    def secs_to_auto_end(self) -> float:
        """How many seconds remain until the game auto-ends. 0 if over."""
        return max(GAME_AUTO_END_SECS - utils.elapsed_secs(self.created_at), 0)

    def session_may_submit(self, session_id: UUID) -> bool:
        """Whether the given session ID is permitted to submit again.

        A client may submit words so long as:
        - the game's auto-end time has not passed
        - that client has not declared itself to be done
        """

        # Game auto-end time has passed, nobody may submit anymore
        if self.secs_to_auto_end() <= 0:
            return False

        # Get which session this is, default to False if not found
        sessions = self.get_oriented_sessions(session_id)
        if sessions is None:
            return False

        # The session may submit so long as it has not marked itself done
        return not sessions.this_session.done

    def ended(self) -> bool:
        """Whether the game is ended, per the user's viewpoint.

        Note that sessions may still be able to submit, see `session_may_submit()`.
        """
        return self.secs_to_auto_end() == 0 or (
            self.session_a.play_secs_remaining()
            == self.session_b.play_secs_remaining()
            == 0
        )

    def extract_word(self, path: list[Point]) -> str | None:
        out = ""
        for point in path:
            item = utils.list_get(utils.list_get(self.grid, point.y), point.x)
            if item is None:
                return None
            out += item
        return out or None


def random_grid(template: GridTemplate) -> Grid:
    return [
        [utils.random_alpha() if cell else None for cell in row] for row in template
    ]


def random_template_and_grid() -> Grid:
    return random_grid(random.choice(list(GRID_TEMPLATES.values())))  # noqa: S311
