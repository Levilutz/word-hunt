import os
from uuid import UUID

from fastapi import FastAPI
from pydantic import BaseModel
import psycopg
from psycopg.rows import class_row
from psycopg.types.json import Jsonb

app = FastAPI()


class RootResp(BaseModel):
    foo: str
    baz: int


class PgTable(BaseModel):
    schemaname: str
    tablename: str
    tableowner: str
    tablespace: str | None
    hasindexes: bool
    hasrules: bool
    hastriggers: bool
    rowsecurity: bool


class Game(BaseModel):
    id: UUID
    creator_id: UUID
    game_mode: str
    grid: list[list[str | None]]


@app.get("/")
async def root() -> RootResp:
    return RootResp(foo="bar", baz=125)


@app.get("/test")
async def test() -> list[PgTable]:
    async with await psycopg.AsyncConnection.connect(
        os.getenv("POSTGRES_URL", "")
    ) as conn:
        async with conn.cursor(row_factory=class_row(PgTable)) as cur:
            await cur.execute("SELECT * FROM pg_catalog.pg_tables")
            return await cur.fetchall()


@app.get("/game/{game_id}")
async def get_game(game_id: UUID) -> Game | None:
    async with await psycopg.AsyncConnection.connect(
        os.getenv("POSTGRES_URL", "")
    ) as conn:
        async with conn.cursor(row_factory=class_row(Game)) as cur:
            await cur.execute("SELECT * FROM games WHERE id = %s", (game_id,))
            return await cur.fetchone()
