from contextlib import asynccontextmanager
from datetime import datetime
import os
from typing import Literal
from uuid import UUID, uuid4

from fastapi import FastAPI
from pydantic import BaseModel
import psycopg
from psycopg.rows import class_row
from psycopg.types.json import Jsonb
from psycopg.types.enum import EnumInfo, register_enum

from src.utils import random_grid
from src.core import GameMode, Grid
from src.grid_templates import GridTemplateName, GRID_TEMPLATES
from src.data_models import Game

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


app = FastAPI(lifespan=lifespan)


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
