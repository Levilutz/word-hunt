from typing import TypeVar

from pydantic import BaseModel

T = TypeVar("T")


Grid = list[list[str | None]]
GridTemplate = list[list[bool]]


class Point(BaseModel):
    x: int
    y: int


def list_get(l: list[T] | None, ind: int) -> T | None:
    """Get an item from the list, if present. Default to None."""
    if l is None:
        return None
    if ind < 0 or ind >= len(l):
        return None
    return l[ind]


def extract_word(grid: Grid, path: list[Point]) -> str | None:
    """Extract a word from the grid given a path. Returns None if path invalid or empty."""
    out = ""
    for point in path:
        item = list_get(list_get(grid, point.y), point.x)
        if item is None:
            return None
        out += item
    return out or None


def points_for_word(word: str) -> int:
    points_by_len = {
        3: 100,
        4: 400,
        5: 800,
        6: 1400,
        7: 1800,
        8: 2200,
    }
    return points_by_len.get(len(word), 0)


def points_for_words(words: list[str]) -> int:
    return sum(points_for_word(word) for word in words)
