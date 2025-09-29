from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import os
from typing import AsyncGenerator
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from psycopg_pool import AsyncConnectionPool
from pydantic import BaseModel
import psycopg
from psycopg.types.enum import EnumInfo, register_enum

from src.utils import random_grid
from src.constants import GAME_AUTO_END_SECS
from src.core import GameMode, Grid, Point, extract_word
from src.db import create_game, get_game, join_game, submit_words
from src.grid_templates import GridTemplateName, GRID_TEMPLATES
from src.data_models import Game, GameSubmittedWord


ENVIRONMENT = os.getenv("ENV", "prod")
POSTGRES_URL = os.getenv("POSTGRES_URL", "")

pool: AsyncConnectionPool | None = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global pool
    async with await psycopg.AsyncConnection.connect(POSTGRES_URL) as conn:
        info = await EnumInfo.fetch(conn, "game_mode")
        if info is None:
            raise Exception("game_mode enum missing")
        register_enum(info, None, GameMode)
    pool = AsyncConnectionPool(conninfo=POSTGRES_URL)
    await pool.open()
    yield
    await pool.close()
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


async def get_db_conn() -> AsyncGenerator[psycopg.AsyncConnection]:
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


def construct_game(
    creator_id: UUID, game_mode: GameMode, template_name: GridTemplateName
) -> Game:
    game_id = uuid4()
    grid = random_grid(GRID_TEMPLATES[template_name])

    end_time: datetime | None = None
    if game_mode == GameMode.solve:
        end_time = datetime.now()
    elif game_mode == GameMode.solo:
        end_time = datetime.now() + timedelta(seconds=GAME_AUTO_END_SECS)

    return Game(
        id=game_id,
        created_at=datetime.now(),
        creator_id=creator_id,
        competitor_id=None,
        game_mode=game_mode,
        grid=grid,
        start_time=datetime.now() if game_mode != GameMode.versus else None,
        end_time=end_time,
    )


class GetGameRespPlayer(BaseModel):
    num_points: int
    """How many points this player has."""

    found_words: list[str]
    """Which words has this player found."""


class GetGameResp(BaseModel):
    game_id: UUID
    """The ID of the game."""

    game_mode: GameMode
    """The game mode."""

    grid: Grid
    """The grid of characters for this game."""

    ready: bool
    """Whether the game is ready. Only false in two-player game before start."""

    ended: bool
    """Whether the game is over. Triggered when both players finish, or too much time passes."""

    this_player: GetGameRespPlayer
    """The details for the player retrieving game info."""

    other_player: GetGameRespPlayer | None
    """The details for the other player, if present."""


class CreateGameReq(BaseModel):
    game_mode: GameMode
    template_name: GridTemplateName


@app.post("/game/create")
async def post_create_game(
    req: CreateGameReq,
    session_id: UUID = Depends(get_session_id),
    db_conn: psycopg.AsyncConnection = Depends(get_db_conn),
) -> GetGameResp:
    game = construct_game(session_id, req.game_mode, req.template_name)
    await create_game(db_conn, game)
    return GetGameResp(
        game_id=game.id,
        game_mode=game.game_mode,
        grid=game.grid,
        ready=game.start_time is not None and game.start_time < datetime.now(),
        ended=game.end_time is not None and game.end_time < datetime.now(),
        this_player=GetGameRespPlayer(
            num_points=0,
            found_words=[],
        ),
        other_player=None,
    )


@app.get("/game/{game_id}")
async def get_game_by_id(
    game_id: UUID,
    session_id: UUID = Depends(get_session_id),
    db_conn: psycopg.AsyncConnection = Depends(get_db_conn),
) -> GetGameResp:
    game = await get_game(db_conn, game_id)
    if game is None:
        raise HTTPException(status_code=404)

    # Solo game is only accessible to creator
    if game.game_mode == GameMode.solo:
        if session_id != game.creator_id:
            raise HTTPException(status_code=403)

    # Versus game is only accessible to participants
    elif game.game_mode == GameMode.versus:
        # If game already has both participants, ensure caller is one of them
        if game.competitor_id is not None:
            if session_id not in [game.creator_id, game.competitor_id]:
                raise HTTPException(status_code=403)

        # Game does not have a competitor yet, join
        elif session_id != game.creator_id:
            success = await join_game(db_conn, game_id, session_id)
            if not success:
                raise HTTPException(status_code=403, detail="Game no longer open")

    # TODO get game fresh
    return GetGameResp(
        game_id=game.id,
        game_mode=game.game_mode,
        grid=game.grid,
        ready=game.start_time is not None and game.start_time < datetime.now(),
        ended=game.end_time is not None and game.end_time < datetime.now(),
        this_player=GetGameRespPlayer(
            num_points=0,
            found_words=[],
        ),
        other_player=None,
    )


class SubmitWordsReq(BaseModel):
    paths: list[list[Point]]


@app.post("/game/{game_id}/submit-words")
async def post_game_submit_words(
    game_id: UUID,
    req: SubmitWordsReq,
    session_id: UUID = Depends(get_session_id),
    db_conn: psycopg.AsyncConnection = Depends(get_db_conn),
) -> None:
    # Ensure paths submitted
    if len(req.paths) == 0:
        raise HTTPException(status_code=400, detail="No paths provided")

    # Pull the game
    game = await get_game(db_conn, game_id)
    if game is None:
        raise HTTPException(status_code=404)

    # Ensure user has access to this game
    if session_id not in [game.creator_id, game.competitor_id]:
        raise HTTPException(status_code=403)

    # Ensure game isn't pre-ready
    if game.start_time is None or game.start_time > datetime.now():
        raise HTTPException(status_code=400, detail="Game not started yet")

    # Ensure game isn't over
    if game.end_time is not None and game.end_time < datetime.now():
        raise HTTPException(status_code=400, detail="Game ended")

    # Validate submitted words and build data models
    submitted_words: list[GameSubmittedWord] = []
    for i, path in enumerate(req.paths):
        word = extract_word(game.grid, path)
        if word is None:
            raise HTTPException(status_code=400, detail=f"Path {i} invalid")
        # TODO: Validate against word list
        submitted_words.append(
            GameSubmittedWord(
                id=uuid4(),
                game_id=game_id,
                submitter_id=session_id,
                tile_path=path,
                word=word,
            )
        )

    # Insert submitted words into DB
    await submit_words(db_conn, submitted_words)
