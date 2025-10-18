from asyncio import sleep
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import os
import random
from typing import AsyncGenerator
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from psycopg_pool import AsyncConnectionPool
from psycopg import AsyncConnection
from pydantic import BaseModel

from src import db
from src.constants import GAME_AUTO_END_SECS
from src.core import Grid, Point, extract_word, points_for_words
from src.data_models import VersusGameSubmittedWord
from src.grid_templates import GRID_TEMPLATES
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


class GetGameRespPlayer(BaseModel):
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
    session_id: UUID = Depends(get_session_id),
    db_conn: AsyncConnection = Depends(get_db_conn),
) -> GetGameResp:
    # Get the game, 404 if not present
    game = await db.versus_game_get(db_conn, game_id)
    if game is None:
        raise HTTPException(status_code=404)

    # Ensure this session is a participant in the game
    if session_id != game.session_id_a and session_id != game.session_id_b:
        raise HTTPException(status_code=403)

    # Determine if game ended (automatically or both users complete)
    auto_ended = (datetime.now() - game.created_at) > timedelta(
        seconds=GAME_AUTO_END_SECS
    )
    both_done = game.session_id_a_done and game.session_id_b_done

    # Pull and categorize the game's submitted words
    game_words = await db.versus_game_get_words(db_conn, game.id)
    this_player_words = [gw.word for gw in game_words if gw.session_id == session_id]
    other_player_words = [gw.word for gw in game_words if gw.session_id != session_id]

    # Build resp
    return GetGameResp(
        game_id=game.id,
        grid=game.grid,
        ended=auto_ended or both_done,
        this_player=GetGameRespPlayer(
            points=points_for_words(this_player_words), words=this_player_words
        ),
        other_player=GetGameRespPlayer(
            points=points_for_words(other_player_words), words=other_player_words
        ),
    )


class SubmitWordsReq(BaseModel):
    paths: list[list[Point]]


@app.post("/game/{game_id}/submit-words")
async def game_submit_words(
    game_id: UUID,
    req: SubmitWordsReq,
    session_id: UUID = Depends(get_session_id),
    db_conn: AsyncConnection = Depends(get_db_conn),
) -> None:
    # Ensure paths submitted
    if len(req.paths) == 0:
        raise HTTPException(status_code=400, detail="No paths provided")

    # Pull the game
    game = await db.versus_game_get(db_conn, game_id)
    if game is None:
        raise HTTPException(status_code=404)

    # Ensure user has access to this game
    if session_id != game.session_id_a and session_id != game.session_id_b:
        raise HTTPException(status_code=403)

    # Determine if we're allowed to submit words
    auto_ended = (datetime.now() - game.created_at) > timedelta(
        seconds=GAME_AUTO_END_SECS
    )
    us_done = (session_id == game.session_id_a and game.session_id_a_done) or (
        session_id == game.session_id_b and game.session_id_b_done
    )
    if auto_ended or us_done:
        raise HTTPException(status_code=400, detail="Submissions no longer accepted")

    # Build db input and validate as we go
    submitted_words: list[VersusGameSubmittedWord] = []
    for i, path in enumerate(req.paths):
        word = extract_word(game.grid, path)
        if word is None:
            raise HTTPException(status_code=400, detail=f"Path {i} invalid")
        # TODO: Validate word in dictionary
        submitted_words.append(
            VersusGameSubmittedWord(
                id=uuid4(),
                game_id=game_id,
                session_id=session_id,
                tile_path=path,
                word=word,
            )
        )

    # Insert the words into the db
    await db.versus_game_submit_words(db_conn, submitted_words)


@app.post("/game/{game_id}/done")
async def game_set_player_done(
    game_id: UUID,
    session_id: UUID = Depends(get_session_id),
    db_conn: AsyncConnection = Depends(get_db_conn),
) -> None:
    # Pull the game
    game = await db.versus_game_get(db_conn, game_id)
    if game is None:
        raise HTTPException(status_code=404)

    # Ensure user has access to this game
    if session_id != game.session_id_a and session_id != game.session_id_b:
        raise HTTPException(status_code=403)

    # Set the given player to be done
    await db.versus_game_set_player_done(
        db_conn,
        game_id,
        "a" if session_id == game.session_id_a else "b",
    )
