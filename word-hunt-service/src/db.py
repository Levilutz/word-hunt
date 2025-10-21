import time
from asyncio import sleep
from dataclasses import dataclass
from uuid import UUID, uuid4

from psycopg import AsyncConnection
from psycopg.rows import class_row

from src.data_models import (
    VersusGamesMatchQueueItem,
)


async def versus_queue_join(db_conn: AsyncConnection, session_id: UUID) -> UUID:
    """Join the versus queue, or reset queue entry if already present.

    Returns queue entry id.
    """

    query = """
    INSERT INTO versus_games_match_queue (id, session_id)
    VALUES (%s, %s)
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
        AND join_time > NOW() - INTERVAL '20 second'
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
    RETURNING *
    """

    async with db_conn.cursor(row_factory=class_row(VersusGamesMatchQueueItem)) as cur:
        game_id = uuid4()
        await cur.execute(query, (game_id, session_id, session_id, session_id))
        result = await cur.fetchone()
        if result is None:
            return VersusQueueNoMatchYet()
        return VersusQueueMatched(game_id=game_id, other_session_id=result.session_id)
