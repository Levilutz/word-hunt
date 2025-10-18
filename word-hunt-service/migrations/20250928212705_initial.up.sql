BEGIN;

CREATE TABLE IF NOT EXISTS versus_games_match_queue(
    session_id UUID PRIMARY KEY,
    join_time TIMESTAMP NOT NULL,
    game_id UUID
);

CREATE INDEX versus_games_match_queue_join_time ON versus_games_match_queue (join_time);

CREATE TABLE IF NOT EXISTS versus_games(
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    session_id_a UUID NOT NULL,
    session_id_b UUID NOT NULL,
    grid JSONB NOT NULL
);

CREATE INDEX versus_games_created_at ON versus_games (created_at);
CREATE INDEX versus_games_session_id_a ON versus_games (session_id_a);
CREATE INDEX versus_games_session_id_b ON versus_games (session_id_b);

CREATE TABLE IF NOT EXISTS versus_game_submitted_words(
    id UUID PRIMARY KEY,
    game_id UUID NOT NULL REFERENCES versus_games(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    tile_path JSONB NOT NULL,
    word VARCHAR NOT NULL
);

CREATE INDEX versus_game_submitted_words_submitted_words_game_id ON versus_game_submitted_words(game_id);

COMMIT;
