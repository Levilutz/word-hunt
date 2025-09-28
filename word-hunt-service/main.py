import os

from fastapi import FastAPI
from pydantic import BaseModel
import psycopg
from psycopg.rows import class_row

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
