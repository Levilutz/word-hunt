from datetime import datetime, timedelta
from uuid import UUID
from psycopg import AsyncConnection
from psycopg.rows import class_row
from psycopg.types.json import Jsonb

from src.data_models import Game, GameSubmittedWord
from src.constants import GAME_AUTO_END_SECS


async def create_game(db_conn: AsyncConnection, game: Game) -> None:
    async with db_conn.cursor() as cur:
        await cur.execute(
            "INSERT INTO games VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (
                game.id,
                game.created_at,
                game.creator_id,
                game.competitor_id,
                game.game_mode,
                Jsonb(game.grid),
                game.start_time,
                game.end_time,
            ),
        )


async def get_game(db_conn: AsyncConnection, game_id: UUID) -> Game | None:
    async with db_conn.cursor(row_factory=class_row(Game)) as cur:
        await cur.execute("SELECT * FROM games WHERE id = %s", (game_id,))
        return await cur.fetchone()


async def join_game(db_conn: AsyncConnection, game_id: UUID, session_id: UUID) -> bool:
    async with db_conn.cursor() as cur:
        start_time = datetime.now()
        await cur.execute(
            "UPDATE games "
            "SET competitor_id = %s, start_time = %s, end_time = %s "
            "WHERE id = %s "
            "    AND competitor_id IS NULL "
            "    AND game_mode = 'versus' "
            "    AND creator_id != %s",
            (
                session_id,
                start_time,
                start_time + timedelta(seconds=GAME_AUTO_END_SECS),
                game_id,
                session_id,
            ),
        )
        await db_conn.commit()
        # Fail if someone beat us to the update
        return cur.rowcount > 0


async def submit_words(
    db_conn: AsyncConnection, submitted_words: list[GameSubmittedWord]
) -> None:
    async with db_conn.cursor() as cur:
        await cur.executemany(
            "INSERT INTO game_submitted_words VALUES (%s, %s, %s, %s, %s)",
            [
                (
                    submitted_word.id,
                    submitted_word.game_id,
                    submitted_word.submitter_id,
                    Jsonb([point.model_dump() for point in submitted_word.tile_path]),
                    submitted_word.word,
                )
                for submitted_word in submitted_words
            ],
        )
