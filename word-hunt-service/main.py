from contextlib import asynccontextmanager
from datetime import datetime
import os
from typing import Literal
from uuid import UUID, uuid4

from fastapi import FastAPI, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg
from psycopg.rows import class_row
from psycopg.types.json import Jsonb
from psycopg.types.enum import EnumInfo, register_enum

from src.utils import random_grid
from src.core import GameMode, Grid
from src.grid_templates import GridTemplateName, GRID_TEMPLATES
from src.data_models import Game


ENVIRONMENT = os.getenv("ENV", "prod")
POSTGRES_URL = os.getenv("POSTGRES_URL", "")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    async with await psycopg.AsyncConnection.connect(POSTGRES_URL) as conn:
        info = await EnumInfo.fetch(conn, "game_mode")
        if info is None:
            raise Exception("game_mode enum missing")
        register_enum(info, None, GameMode)
    yield
    print("closing...")


async def get_session_id(request: Request, response: Response) -> str:
    session_id: str | None = request.cookies.get("session_id")
    if session_id is None:
        session_id = str(uuid4())
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            secure=ENVIRONMENT != "dev",
        )
    return session_id


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
    return Game(
        id=game_id,
        created_at=datetime.now(),
        creator_id=creator_id,
        competitor_id=None,
        game_mode=game_mode,
        grid=grid,
    )


class GetGameResp(BaseModel):
    game_id: UUID
    game_mode: GameMode
    grid: Grid
    status: Literal["waiting", "started", "ended"]


class CreateGameReq(BaseModel):
    game_mode: GameMode
    template_name: GridTemplateName


@app.get("/test")
async def test(session_id: str = Depends(get_session_id)) -> str:
    return f"Your session id is {session_id}"


@app.post("/game/create")
async def create_game(req: CreateGameReq) -> GetGameResp:
    game = construct_game(uuid4(), req.game_mode, req.template_name)
    async with await psycopg.AsyncConnection.connect(POSTGRES_URL) as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO games VALUES (%s, %s, %s, %s, %s, %s)",
                (
                    game.id,
                    game.created_at,
                    game.creator_id,
                    game.competitor_id,
                    game.game_mode,
                    Jsonb(game.grid),
                ),
            )
    return GetGameResp(
        game_id=game.id, game_mode=game.game_mode, grid=game.grid, status="waiting"
    )


@app.get("/game/{game_id}")
async def get_game(game_id: UUID) -> GetGameResp | None:
    async with await psycopg.AsyncConnection.connect(POSTGRES_URL) as conn:
        async with conn.cursor(row_factory=class_row(Game)) as cur:
            await cur.execute("SELECT * FROM games WHERE id = %s", (game_id,))
            game = await cur.fetchone()
    if game is None:
        return None
    return GetGameResp(
        game_id=game.id, game_mode=game.game_mode, grid=game.grid, status="waiting"
    )
