import time
from asyncio import sleep
from uuid import UUID, uuid4

from psycopg import AsyncConnection
from psycopg.rows import class_row

from src.versus_match_queue import data_models, domain


class VersusMatchQueueRepository:
    _db_conn: AsyncConnection

    def __init__(self, db_conn: AsyncConnection) -> None:
        self._db_conn = db_conn

    async def match(
        self,
        session_id: UUID,
        poll_interval: float = 0.1,
        limit_poll_time: float = 30.0,
    ) -> domain.VersusQueueMatch | None:
        """Attempt to find a match for a versus game."""

        # First, try to match with an existing session on the queue
        match_result = await self._db_versus_queue_match(session_id)
        if match_result is not None:
            # We received a match, it's caller's responsibility to construct the game
            game_id, other_session_id = match_result
            return domain.VersusQueueMatch(
                game_id=game_id,
                other_session_id=other_session_id,
                must_create_game=True,
            )

        # We didn't match, join the queue
        queue_entry_id = await self._db_versus_queue_join(session_id)

        # Poll until we're assigned a match
        start_time = time.time()
        while (time.time() - start_time) < limit_poll_time:  # Just-in-case limit
            check_result, expired = await self._db_versus_queue_check(queue_entry_id)
            if check_result is not None:
                # We were given a match, the partner will construct the game
                game_id, other_session_id = check_result
                return domain.VersusQueueMatch(
                    game_id=game_id,
                    other_session_id=other_session_id,
                    must_create_game=False,
                )
            if expired:
                return None
            await sleep(poll_interval)

        # Poll timeout expired, exit with no match
        return None

    async def _db_versus_queue_join(self, session_id: UUID) -> UUID:
        """Join the versus queue. Returns queue entry id."""

        query = """
        INSERT INTO versus_games_match_queue (id, session_id)
        VALUES (%s, %s)
        """
        queue_entry_id = uuid4()
        await self._db_conn.execute(
            query,
            (queue_entry_id, session_id),
        )
        return queue_entry_id

    async def _db_versus_queue_check(
        self, queue_entry_id: UUID
    ) -> tuple[tuple[UUID, UUID] | None, bool]:
        """Check the status of an entry after joining the versus queue.

        Returns ((game_id, other_session_id), expired).
        """

        # We let it roll for 20 seconds, even tho matching only covers first 15
        # Better to check too long vs expire concurrent with someone matching us
        query = """
        SELECT * FROM versus_games_match_queue
        WHERE id = %s
            AND join_time > NOW() - INTERVAL '20 second'
        """
        async with self._db_conn.cursor(
            row_factory=class_row(data_models.VersusGamesMatchQueueItem)
        ) as cur:
            await cur.execute(query, (queue_entry_id,))
            result = await cur.fetchone()
            if result is None:
                return None, True
            if result.game_id is None:
                return None, False
            if result.other_session_id is None:
                raise ValueError(f"Missing other session id for game {result.game_id}")
            return (result.game_id, result.other_session_id), False

    async def _db_versus_queue_match(
        self, session_id: UUID
    ) -> tuple[UUID, UUID] | None:
        """Attempt to match with an existing session on the match queue.

        Returns (game_id, other_session_id).
        """

        # We only accept conns from within 15 seconds, even tho polling goes for 20
        # Better to let them check too long vs match with someone concurrently expiring
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

        async with self._db_conn.cursor(
            row_factory=class_row(data_models.VersusGamesMatchQueueItem)
        ) as cur:
            game_id = uuid4()
            await cur.execute(query, (game_id, session_id, session_id, session_id))
            result = await cur.fetchone()
            if result is None:
                return None
            return game_id, result.session_id
