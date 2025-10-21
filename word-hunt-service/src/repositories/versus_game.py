import asyncio
from typing import Literal
from uuid import UUID

from psycopg import AsyncConnection
from psycopg.rows import class_row
from psycopg.types.json import Jsonb

from src import data_models
from src.core import Grid
from src.domain.versus_game import (
    VersusGame,
    VersusGameSession,
    VersusGameSubmittedWord,
)


class VersusGameRepository:
    _db_conn: AsyncConnection

    def __init__(self, db_conn: AsyncConnection) -> None:
        self._db_conn = db_conn

    async def get_versus_game(self, game_id: UUID) -> VersusGame | None:
        """Get a versus game from the DB."""

        db_game, db_submitted_words = await asyncio.gather(
            self._db_versus_game_get(game_id),
            self._db_versus_game_submitted_words_list(game_id),
        )
        if db_game is None:
            return None

        return VersusGame(
            game_id=game_id,
            created_at=db_game.created_at,
            session_a=VersusGameSession(
                session_id=db_game.session_a_id,
                start=db_game.session_a_start,
                done=db_game.session_a_done,
                submitted_words=VersusGameSubmittedWord.dedup(
                    [
                        VersusGameSubmittedWord(
                            submitted_word_id=db_word.id,
                            tile_path=db_word.tile_path,
                            word=db_word.word,
                        )
                        for db_word in db_submitted_words
                        if db_word.session_id == db_game.session_a_id
                    ]
                ),
            ),
            session_b=VersusGameSession(
                session_id=db_game.session_b_id,
                start=db_game.session_b_start,
                done=db_game.session_b_done,
                submitted_words=VersusGameSubmittedWord.dedup(
                    [
                        VersusGameSubmittedWord(
                            submitted_word_id=db_word.id,
                            tile_path=db_word.tile_path,
                            word=db_word.word,
                        )
                        for db_word in db_submitted_words
                        if db_word.session_id == db_game.session_b_id
                    ]
                ),
            ),
            grid=db_game.grid,
        )

    async def _db_versus_game_construct(
        self,
        game_id: UUID,
        session_a_id: UUID,
        session_b_id: UUID,
        grid: Grid,
    ) -> data_models.VersusGame:
        """Construct a new versus game."""

        query = """
        INSERT INTO versus_games (id, session_a_id, session_b_id, grid)
        VALUES (%s, %s, %s, %s)
        RETURNING *
        """
        async with self._db_conn.cursor(
            row_factory=class_row(data_models.VersusGame)
        ) as cur:
            await cur.execute(
                query,
                (
                    game_id,
                    session_a_id,
                    session_b_id,
                    Jsonb(grid),
                ),
            )
            result = await cur.fetchone()
            if result is None:
                raise ValueError("Expected game to exist after insert")
            return result

    async def _db_versus_game_get(self, game_id: UUID) -> data_models.VersusGame | None:
        """Get a versus game data model."""

        async with self._db_conn.cursor(
            row_factory=class_row(data_models.VersusGame)
        ) as cur:
            await cur.execute("SELECT * FROM versus_games WHERE id = %s", (game_id,))
            return await cur.fetchone()

    async def _db_versus_game_set_player_start(
        self, game_id: UUID, player: Literal["a", "b"]
    ) -> None:
        """Set the given player to be done submitting words."""

        # Just to be safe against injection
        if player != "a" and player != "b":  # noqa: PLR1714
            raise ValueError(f"Invalid player id: {player}")

        query = f"""
        UPDATE versus_games
        SET session_{player}_start = NOW()
        WHERE id = %s
            AND session_{player}_start IS NULL
        """  # noqa: S608

        await self._db_conn.execute(query, (game_id,))

    async def _db_versus_game_set_player_done(
        self, game_id: UUID, player: Literal["a", "b"]
    ):
        """Set the given player to be done submitting words."""

        # Just to be safe against injection
        if player != "a" and player != "b":  # noqa: PLR1714
            raise ValueError(f"Invalid player id: {player}")

        query = f"""
        UPDATE versus_games
        SET session_{player}_done = TRUE
        WHERE id = %s
        """  # noqa: S608

        await self._db_conn.execute(query, (game_id,))

    async def _db_versus_game_submitted_words_list(
        self, game_id: UUID
    ) -> list[data_models.VersusGameSubmittedWord]:
        async with self._db_conn.cursor(
            row_factory=class_row(data_models.VersusGameSubmittedWord)
        ) as cur:
            await cur.execute(
                "SELECT * FROM versus_game_submitted_words WHERE game_id = %s",
                (game_id,),
            )
            return await cur.fetchall()

    async def _db_versus_game_submitted_words_insert(
        self, submitted_words: list[data_models.VersusGameSubmittedWord]
    ) -> None:
        query = """
        INSERT INTO versus_game_submitted_words
            (id, game_id, session_id, tile_path, word)
        VALUES (%s, %s, %s, %s, %s)
        """
        async with self._db_conn.cursor() as cur:
            await cur.executemany(
                query,
                [
                    (
                        submitted_word.id,
                        submitted_word.game_id,
                        submitted_word.session_id,
                        Jsonb(
                            [point.model_dump() for point in submitted_word.tile_path]
                        ),
                        submitted_word.word,
                    )
                    for submitted_word in submitted_words
                ],
            )
