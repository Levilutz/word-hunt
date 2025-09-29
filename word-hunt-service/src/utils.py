import random

from src.core import Grid, GridTemplate


def random_alpha() -> str:
    return random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")


def random_grid(template: GridTemplate) -> Grid:
    return [[random_alpha() if cell else None for cell in row] for row in template]
