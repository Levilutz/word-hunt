import random
from datetime import datetime
from typing import TypeVar

T = TypeVar("T")


def random_alpha() -> str:
    return random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")  # noqa: S311


def list_get(ls: list[T] | None, ind: int) -> T | None:
    """Get an item from the list, if present. Default to None."""
    if ls is None:
        return None
    if ind < 0 or ind >= len(ls):
        return None
    return ls[ind]


def elapsed_secs(dt: datetime) -> float:
    """Get the number of seconds elapsed since the given datetime."""
    return (datetime.now() - dt).total_seconds()
