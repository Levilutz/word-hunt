from asyncio import sleep
from contextlib import asynccontextmanager
import os
import random
from typing import AsyncGenerator
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from psycopg import AsyncConnection
from psycopg_pool import AsyncConnectionPool
from pydantic import BaseModel

from src import db
from src.grid_templates import GridTemplateName, GRID_TEMPLATES
from src.utils import random_grid


ENVIRONMENT = os.getenv("ENV", "prod")
POSTGRES_URL = os.getenv("POSTGRES_URL", "")

pool: AsyncConnectionPool | None = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global pool
    async with AsyncConnectionPool(
        conninfo=POSTGRES_URL,
        connection_class=AsyncConnection,
        kwargs={"autocommit": True},
    ) as conn_pool:
        pool = conn_pool
        yield
    print("closing...")


async def get_session_id(request: Request, response: Response) -> UUID:
    session_id: str | None = request.cookies.get("session_id")
    if session_id is None:
        session_id = request.headers.get("x-session-id")
    if session_id is None:
        session_id = str(uuid4())
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            secure=ENVIRONMENT != "dev",
        )
    return UUID(session_id)


async def get_db_conn() -> AsyncGenerator[AsyncConnection]:
    if pool is None:
        raise Exception("Cannot access connection pool")
    async with pool.connection() as db_conn:
        yield db_conn


app = FastAPI(lifespan=lifespan)

if ENVIRONMENT == "dev":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/ping")
async def ping() -> str:
    return "OK"


class PostMatchResp(BaseModel):
    game_id: UUID | None


@app.post("/match")
async def match(
    session_id: UUID = Depends(get_session_id),
    db_conn: AsyncConnection = Depends(get_db_conn),
) -> PostMatchResp:
    # First, try to match with an existing player
    match_result = await db.versus_queue_match(db_conn, session_id)
    if isinstance(match_result, db.VersusQueueMatched):
        # We got a match, it's our responsibility to actually construct the game
        await db.versus_game_create(
            db_conn,
            match_result.game_id,
            match_result.other_session_id,
            session_id,
            random_grid(random.choice(list(GRID_TEMPLATES.values()))),
        )

        return PostMatchResp(game_id=match_result.game_id)

    # We didn't match, join the queue
    await db.versus_queue_join(db_conn, session_id)

    # Poll until we're assigned a match, or exit if expired
    check_result = await db.versus_queue_check_poll(db_conn, session_id)
    if isinstance(check_result, db.VersusQueueExpired):
        return PostMatchResp(game_id=None)

    # Poll until game exists
    for _ in range(1000):
        result = await db.versus_game_get(db_conn, check_result.game_id)
        if result is not None:
            break
        await sleep(0.1)
    else:
        return PostMatchResp(game_id=None)

    return PostMatchResp(game_id=None)
