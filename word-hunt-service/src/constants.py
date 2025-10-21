from typing import Literal

from src.core import GridTemplate

GAME_DURATION_SECS = 80
"""How long a game is."""

GAME_AUTO_END_SECS = GAME_DURATION_SECS + 30
"""After this many seconds, the game will force end even if both clients aren't done."""

POINTS_BY_LEN = {
    3: 100,
    4: 400,
    5: 800,
    6: 1400,
    7: 1800,
    8: 2200,
}
"""How many points are awarded for words of the given length."""

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
