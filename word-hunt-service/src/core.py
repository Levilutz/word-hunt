from pydantic import BaseModel

Grid = list[list[str | None]]
GridTemplate = list[list[bool]]


class Point(BaseModel):
    x: int
    y: int
