import random
from typing import TypeVar

from src.core import Grid, GridTemplate

T = TypeVar("T")


def random_alpha() -> str:
    return random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")  # noqa: S311


def random_grid(template: GridTemplate) -> Grid:
    return [[random_alpha() if cell else None for cell in row] for row in template]


def list_get(ls: list[T] | None, ind: int) -> T | None:
    """Get an item from the list, if present. Default to None."""
    if ls is None:
        return None
    if ind < 0 or ind >= len(ls):
        return None
    return ls[ind]
