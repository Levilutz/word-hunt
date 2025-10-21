from typing import Literal

from src.versus_game import domain

GridTemplateName = Literal["standard", "o", "x", "big"]

GRID_TEMPLATES: dict[GridTemplateName, domain.GridTemplate] = {
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
