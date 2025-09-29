from enum import Enum


Grid = list[list[str | None]]
GridTemplate = list[list[bool]]


class GameMode(Enum):
    versus = "versus"
    solo = "solo"
    solve = "solve"
