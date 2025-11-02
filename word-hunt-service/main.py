import os
import time
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

from src.versus_game.domain import (
    Grid,
    random_template_and_grid,
)
from src.versus_game.domain import (
    Point as VersusGamePoint,
)
from src.versus_game.repository import VersusGameRepository
from src.versus_match_queue.repository import VersusMatchQueueRepository

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


class Point(BaseModel):
    x: int
    y: int


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
    # To limit polling later in fn
    start_time = time.time()
    max_total_request_time = 50

    # Construct repositories
    versus_match_queue_repository = VersusMatchQueueRepository(db_conn)
    versus_game_repository = VersusGameRepository(db_conn)

    # Try to get a match
    match = await versus_match_queue_repository.match(session_id)

    # We did not get a match
    if match is None:
        return PostMatchResp(game_id=None)

    # If it's our responsibility to construct the game, construct and return
    if match.must_create_game:
        await versus_game_repository.create_versus_game(
            match.game_id,
            match.matched_player_session_id,
            session_id,
            random_template_and_grid(),
        )
        return PostMatchResp(game_id=match.game_id)

    # It's the match partner's responsibility to construct the game, poll until exists
    while (time.time() - start_time) < max_total_request_time:
        result = await versus_game_repository.get_versus_game(match.game_id)
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
    players = game.get_oriented_players(session_id)
    if players is None:
        raise HTTPException(status_code=403)

    # Build resp
    return GetGameResp(
        game_id=game.game_id,
        grid=game.grid,
        ended=game.ended(),
        this_player=GetGameRespPlayer(
            seconds_remaining=players.this_player.play_secs_remaining(),
            points=players.this_player.points(),
            words=[word.word for word in players.this_player.submitted_words],
        ),
        other_player=GetGameRespPlayer(
            seconds_remaining=players.other_player.play_secs_remaining(),
            points=players.other_player.points(),
            words=[word.word for word in players.other_player.submitted_words],
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
    players = game.get_oriented_players(session_id)
    if players is None:
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
    players = game.get_oriented_players(session_id)
    if players is None:
        raise HTTPException(status_code=403)

    # Determine if we're allowed to submit words
    if not game.player_may_submit(session_id):
        raise HTTPException(status_code=400, detail="Submissions no longer accepted")

    # An attempt to submit words qualifies as starting the game, even if words invalid
    if players.this_player.start is None:
        await versus_game_repository.update_versus_game_player_start(
            game_id, session_id
        )

    # Extract words and validate
    validated_words: list[tuple[str, list[VersusGamePoint]]] = []
    for i, req_path in enumerate(req.paths):
        path = [VersusGamePoint(x=point.x, y=point.y) for point in req_path]
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
    players = game.get_oriented_players(session_id)
    if players is None:
        raise HTTPException(status_code=403)

    await versus_game_repository.update_versus_game_player_done(game_id, session_id)
