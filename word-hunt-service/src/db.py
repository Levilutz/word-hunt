import time
from asyncio import sleep
from dataclasses import dataclass
from typing import Literal
from uuid import UUID, uuid4

from psycopg import AsyncConnection
from psycopg.rows import class_row
from psycopg.types.json import Jsonb

from src.core import Grid
from src.data_models import (
    VersusGame,
    VersusGamesMatchQueueItem,
    VersusGameSubmittedWord,
)


async def versus_queue_join(db_conn: AsyncConnection, session_id: UUID) -> UUID:
    """Join the versus queue, or reset queue entry if already present.

    Returns queue entry id.
    """

    query = """
    INSERT INTO versus_games_match_queue (id, session_id)
    VALUES (%s, %s);
    """
    queue_entry_id = uuid4()
    await db_conn.execute(
        query,
        (
            queue_entry_id,
            session_id,
        ),
    )
    return queue_entry_id


@dataclass(frozen=True)
class VersusQueueMatched:
    """This session has matched, and has a game id assigned."""

    game_id: UUID
    other_session_id: UUID


@dataclass(frozen=True)
class VersusQueueNoMatchYet:
    """This session does not yet have a match / a matching session was not found."""


@dataclass(frozen=True)
class VersusQueueExpired:
    """This session's time on the queue has expired - must re-enter queue."""


async def versus_queue_check(
    db_conn: AsyncConnection, queue_entry_id: UUID
) -> VersusQueueMatched | VersusQueueNoMatchYet | VersusQueueExpired:
    """Check the status of our entry after joining the versus queue."""

    # We let it roll for 20 seconds, even tho matching only covers first 15
    # Better to check too long than to expire concurrent with someone matching us
    query = """
    SELECT * FROM versus_games_match_queue
    WHERE id = %s
        AND join_time > NOW() - INTERVAL '20 second';
    """
    async with db_conn.cursor(row_factory=class_row(VersusGamesMatchQueueItem)) as cur:
        await cur.execute(query, (queue_entry_id,))
        result = await cur.fetchone()
        if result is None:
            return VersusQueueExpired()
        if result.game_id is None:
            return VersusQueueNoMatchYet()
        if result.other_session_id is None:
            raise ValueError(f"Missing other session id for game {result.game_id}")
        return VersusQueueMatched(
            game_id=result.game_id, other_session_id=result.other_session_id
        )


async def versus_queue_check_poll(
    db_conn: AsyncConnection,
    queue_entry_id: UUID,
    poll_interval: float = 0.1,
    limit_poll_time: float = 60.0,
) -> VersusQueueMatched | VersusQueueExpired:
    """Check the status of our queue entry repeatedly, until it matches or expires."""

    start_time = time.time()
    while (time.time() - start_time) < limit_poll_time:  # Just-in-case limit
        result = await versus_queue_check(db_conn, queue_entry_id)
        if isinstance(result, VersusQueueMatched | VersusQueueExpired):
            return result
        await sleep(poll_interval)
    return VersusQueueExpired()


async def versus_queue_match(
    db_conn: AsyncConnection,
    session_id: UUID,
) -> VersusQueueMatched | VersusQueueNoMatchYet:
    """Attempt to match with an existing row on the queue."""

    # We only accept conns from within 15 seconds, even tho polling goes for 20
    # Better to let them check too long than match with someone concurrently expiring
    query = """
    UPDATE versus_games_match_queue
    SET game_id = %s, other_session_id = %s, match_time = NOW()
    WHERE session_id = (
            SELECT session_id FROM versus_games_match_queue
            WHERE join_time > NOW() - INTERVAL '15 second'
            AND game_id IS NULL
            AND session_id != %s
            ORDER BY join_time ASC
            LIMIT 1
            FOR UPDATE
        )
        AND join_time > NOW() - INTERVAL '15 second'
        AND game_id IS NULL
        AND session_id != %s
    RETURNING *;
    """

    async with db_conn.cursor(row_factory=class_row(VersusGamesMatchQueueItem)) as cur:
        game_id = uuid4()
        await cur.execute(query, (game_id, session_id, session_id, session_id))
        result = await cur.fetchone()
        if result is None:
            return VersusQueueNoMatchYet()
        return VersusQueueMatched(game_id=game_id, other_session_id=result.session_id)


async def versus_game_create(
    db_conn: AsyncConnection,
    game_id: UUID,
    session_id_a: UUID,
    session_id_b: UUID,
    grid: Grid,
) -> VersusGame:
    """Construct a new versus game."""

    query = """
    INSERT INTO versus_games (id, session_id_a, session_id_b, grid)
    VALUES (%s, %s, %s, %s)
    RETURNING *
    """
    async with db_conn.cursor(row_factory=class_row(VersusGame)) as cur:
        await cur.execute(
            query,
            (
                game_id,
                session_id_a,
                session_id_b,
                Jsonb(grid),
            ),
        )
        result = await cur.fetchone()
        if result is None:
            raise ValueError("Expected game to exist after insert")
        return result


async def versus_game_get(db_conn: AsyncConnection, game_id: UUID) -> VersusGame | None:
    """Get a versus game."""

    async with db_conn.cursor(row_factory=class_row(VersusGame)) as cur:
        await cur.execute("SELECT * FROM versus_games WHERE id = %s", (game_id,))
        return await cur.fetchone()


async def versus_game_set_player_done(
    db_conn: AsyncConnection, game_id: UUID, player: Literal["a", "b"]
):
    """Set the given player to be done submitting words."""

    # Just to be safe against injection
    if player != "a" and player != "b":  # noqa: PLR1714
        raise ValueError(f"Invalid player id: {player}")

    query = f"""
    UPDATE versus_games
    SET session_id_{player}_done = TRUE
    WHERE game_id = %s
    """  # noqa: S608

    await db_conn.execute(query, (game_id,))


async def versus_game_submit_words(
    db_conn: AsyncConnection, submitted_words: list[VersusGameSubmittedWord]
) -> None:
    query = """
    INSERT INTO versus_game_submitted_words (id, game_id, session_id, tile_path, word)
    VALUES (%s, %s, %s, %s, %s)
    """
    async with db_conn.cursor() as cur:
        await cur.executemany(
            query,
            [
                (
                    submitted_word.id,
                    submitted_word.game_id,
                    submitted_word.session_id,
                    Jsonb([point.model_dump() for point in submitted_word.tile_path]),
                    submitted_word.word,
                )
                for submitted_word in submitted_words
            ],
        )


async def versus_game_get_words(
    db_conn: AsyncConnection, game_id: UUID
) -> list[VersusGameSubmittedWord]:
    async with db_conn.cursor(row_factory=class_row(VersusGameSubmittedWord)) as cur:
        await cur.execute(
            "SELECT * FROM versus_game_submitted_words WHERE game_id = %s", (game_id,)
        )
        return await cur.fetchall()
