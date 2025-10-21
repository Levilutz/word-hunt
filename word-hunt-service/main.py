import os
import random
from asyncio import sleep
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from psycopg import AsyncConnection
from psycopg_pool import AsyncConnectionPool
from pydantic import BaseModel

from src import db
from src.core import Grid, Point
from src.grid_templates import GRID_TEMPLATES
from src.repositories.versus_game import VersusGameRepository
from src.utils import random_grid

ENVIRONMENT = os.getenv("ENV", "prod")
POSTGRES_URL = os.getenv("POSTGRES_URL", "")

pool: AsyncConnectionPool | None = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global pool  # noqa: PLW0603
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
        raise ValueError("Cannot access connection pool")
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


@app.get("/cookie0")
async def cookie0(response: Response) -> None:
    response.set_cookie(
        key="session_id",
        value="00000000-0000-4000-8000-000000000000",
        httponly=True,
        secure=ENVIRONMENT != "dev",
    )


class PostMatchResp(BaseModel):
    game_id: UUID | None


@app.post("/match")
async def match(
    session_id: Annotated[UUID, Depends(get_session_id)],
    db_conn: Annotated[AsyncConnection, Depends(get_db_conn)],
) -> PostMatchResp:
    versus_game_repository = VersusGameRepository(db_conn)

    # First, try to match with an existing player
    match_result = await db.versus_queue_match(db_conn, session_id)
    if isinstance(match_result, db.VersusQueueMatched):
        # We got a match, it's our responsibility to actually construct the game
        await versus_game_repository.create_versus_game(
            match_result.game_id,
            match_result.other_session_id,
            session_id,
            random_grid(random.choice(list(GRID_TEMPLATES.values()))),  # noqa: S311
        )

        return PostMatchResp(game_id=match_result.game_id)

    # We didn't match, join the queue
    queue_entry_id = await db.versus_queue_join(db_conn, session_id)

    # Poll until we're assigned a match, or exit if expired
    check_result = await db.versus_queue_check_poll(db_conn, queue_entry_id)
    if isinstance(check_result, db.VersusQueueExpired):
        return PostMatchResp(game_id=None)

    # Poll until game exists
    for _ in range(1000):
        result = await versus_game_repository.get_versus_game(check_result.game_id)
        if result is not None:
            return PostMatchResp(game_id=result.game_id)
        await sleep(0.1)

    # Poll timeout
    return PostMatchResp(game_id=None)


class GetGameRespPlayer(BaseModel):
    seconds_remaining: float | None
    points: int
    words: list[str]


class GetGameResp(BaseModel):
    game_id: UUID
    grid: Grid
    ended: bool
    this_player: GetGameRespPlayer
    other_player: GetGameRespPlayer


@app.get("/game/{game_id}")
async def get_game(
    game_id: UUID,
    session_id: Annotated[UUID, Depends(get_session_id)],
    db_conn: Annotated[AsyncConnection, Depends(get_db_conn)],
) -> GetGameResp:
    # Construct the Game domain model
    versus_game_repository = VersusGameRepository(db_conn)
    game = await versus_game_repository.get_versus_game(game_id)
    if game is None:
        raise HTTPException(status_code=404)

    # Ensure this session is a participant in the game
    sessions = game.get_oriented_sessions(session_id)
    if sessions is None:
        raise HTTPException(status_code=403)

    # Build resp
    return GetGameResp(
        game_id=game.game_id,
        grid=game.grid,
        ended=game.ended(),
        this_player=GetGameRespPlayer(
            seconds_remaining=sessions.this_session.play_secs_remaining(),
            points=sessions.this_session.points(),
            words=[word.word for word in sessions.this_session.submitted_words],
        ),
        other_player=GetGameRespPlayer(
            seconds_remaining=sessions.other_session.play_secs_remaining(),
            points=sessions.other_session.points(),
            words=[word.word for word in sessions.other_session.submitted_words],
        ),
    )


@app.post("/game/{game_id}/start")
async def game_start(
    game_id: UUID,
    session_id: Annotated[UUID, Depends(get_session_id)],
    db_conn: Annotated[AsyncConnection, Depends(get_db_conn)],
) -> None:
    # Construct the Game domain model
    versus_game_repository = VersusGameRepository(db_conn)
    game = await versus_game_repository.get_versus_game(game_id)
    if game is None:
        raise HTTPException(status_code=404)

    # Ensure this session is a participant in the game
    sessions = game.get_oriented_sessions(session_id)
    if sessions is None:
        raise HTTPException(status_code=403)

    await versus_game_repository.update_versus_game_player_start(game_id, session_id)


class SubmitWordsReq(BaseModel):
    paths: list[list[Point]]


@app.post("/game/{game_id}/submit-words")
async def game_submit_words(
    game_id: UUID,
    req: SubmitWordsReq,
    session_id: Annotated[UUID, Depends(get_session_id)],
    db_conn: Annotated[AsyncConnection, Depends(get_db_conn)],
) -> None:
    # Ensure paths submitted
    if len(req.paths) == 0:
        raise HTTPException(status_code=400, detail="No paths provided")

    # Construct the Game domain model
    versus_game_repository = VersusGameRepository(db_conn)
    game = await versus_game_repository.get_versus_game(game_id)
    if game is None:
        raise HTTPException(status_code=404)

    # Ensure this session is a participant in the game
    sessions = game.get_oriented_sessions(session_id)
    if sessions is None:
        raise HTTPException(status_code=403)

    # Determine if we're allowed to submit words
    if not game.session_may_submit(session_id):
        raise HTTPException(status_code=400, detail="Submissions no longer accepted")

    # Extract words and validate
    validated_words: list[tuple[str, list[Point]]] = []
    for i, path in enumerate(req.paths):
        word = game.extract_word(path)
        if word is None:
            raise HTTPException(status_code=400, detail=f"Path {i} invalid")
        # TODO: Validate word in dictionary
        validated_words.append((word, path))

    # Insert the words into the db
    await versus_game_repository.update_versus_game_submit_words(
        game_id, session_id, validated_words
    )


@app.post("/game/{game_id}/done")
async def game_set_player_done(
    game_id: UUID,
    session_id: Annotated[UUID, Depends(get_session_id)],
    db_conn: Annotated[AsyncConnection, Depends(get_db_conn)],
) -> None:
    # Construct the Game domain model
    versus_game_repository = VersusGameRepository(db_conn)
    game = await versus_game_repository.get_versus_game(game_id)
    if game is None:
        raise HTTPException(status_code=404)

    # Ensure this session is a participant in the game
    sessions = game.get_oriented_sessions(session_id)
    if sessions is None:
        raise HTTPException(status_code=403)

    await versus_game_repository.update_versus_game_player_done(game_id, session_id)
