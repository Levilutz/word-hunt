from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import NamedTuple
from uuid import UUID, uuid4

from psycopg import AsyncConnection
from psycopg.rows import class_row
from psycopg.types.json import Jsonb

from src.data_models import Game, GameSubmittedWord, VersusGamesMatchQueue
from src.constants import GAME_AUTO_END_SECS


async def versus_queue_join(db_conn: AsyncConnection, session_id: UUID) -> None:
    """Join the versus queue, or reset queue entry if already present."""

    query = """
    INSERT INTO versus_games_match_queue (session_id)
    VALUES (%s)
    ON CONFLICT (session_id) DO UPDATE SET
        join_time = NOW(),
        game_id = NULL;
    """
    await db_conn.execute(query, (session_id,))


@dataclass(frozen=True)
class VersusQueueMatched:
    """This session has matched, and has a game id assigned."""

    game_id: UUID


@dataclass(frozen=True)
class VersusQueueNoMatchYet:
    """This session does not yet have a match on the queue, or a matching session was not found."""


@dataclass(frozen=True)
class VersusQueueExpired:
    """This session's time on the queue has expired - must re-enter queue."""


async def versus_queue_check(
    db_conn: AsyncConnection, session_id: UUID
) -> VersusQueueMatched | VersusQueueNoMatchYet | VersusQueueExpired:
    """Check the status of our entry after joining the versus queue."""

    # We let it roll for 20 seconds, even tho matching only covers first 15
    # Better to keep checking when hopeless than to expire concurrent with someone matching us
    query = """
    SELECT * FROM versus_games_match_queue
    WHERE session_id = %s
        AND join_time > NOW() - INTERVAL '20 second';
    """
    async with db_conn.cursor(row_factory=class_row(VersusGamesMatchQueue)) as cur:
        await cur.execute(query, (session_id,))
        result = await cur.fetchone()
        if result is None:
            return VersusQueueExpired()
        if result.game_id is None:
            return VersusQueueNoMatchYet()
        return VersusQueueMatched(game_id=result.game_id)


async def versus_queue_match(
    db_conn: AsyncConnection,
) -> VersusQueueMatched | VersusQueueNoMatchYet:
    """Attempt to match with an existing row on the queue."""

    # We only accept conns from within 15 seconds, even tho polling goes for 20
    # Better to let them keep checking when hopeless than match with someone that concurrently expired
    query = """
    UPDATE versus_games_match_queue
    SET game_id = %s
    WHERE session_id = (
            SELECT session_id FROM versus_games_match_queue
            WHERE join_time > NOW() - INTERVAL '15 second'
            AND game_id IS NULL
            ORDER BY join_time ASC
            LIMIT 1
            FOR UPDATE
        )
        AND join_time > NOW() - INTERVAL '15 second'
        AND game_id IS NULL;
    """

    async with db_conn.cursor() as cur:
        game_id = uuid4()
        await cur.execute(query, (game_id,))
        if cur.rowcount == 0:
            return VersusQueueNoMatchYet()
        return VersusQueueMatched(game_id=game_id)


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


async def get_submitted_words(
    db_conn: AsyncConnection, game_id: UUID
) -> list[GameSubmittedWord]:
    async with db_conn.cursor(row_factory=class_row(GameSubmittedWord)) as cur:
        await cur.execute(
            "SELECT * FROM game_submitted_words WHERE game_id = %s", (game_id,)
        )
        return await cur.fetchall()
