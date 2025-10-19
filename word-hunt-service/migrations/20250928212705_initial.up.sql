BEGIN;

CREATE TABLE IF NOT EXISTS versus_games_match_queue(
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL,
    join_time TIMESTAMP NOT NULL DEFAULT NOW(),
    game_id UUID,
    other_session_id UUID,
    match_time TIMESTAMP
);

CREATE INDEX versus_games_match_queue_join_time ON versus_games_match_queue (join_time);

CREATE TABLE IF NOT EXISTS versus_games(
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    session_a_id UUID NOT NULL,
    session_a_start TIMESTAMP,
    session_a_done BOOLEAN NOT NULL DEFAULT FALSE,
    session_b_id UUID NOT NULL,
    session_b_start TIMESTAMP,
    session_b_done BOOLEAN NOT NULL DEFAULT FALSE,
    grid JSONB NOT NULL
);

CREATE INDEX versus_games_created_at ON versus_games (created_at);
CREATE INDEX versus_games_session_a_id ON versus_games (session_a_id);
CREATE INDEX versus_games_session_b_id ON versus_games (session_b_id);

CREATE TABLE IF NOT EXISTS versus_game_submitted_words(
    id UUID PRIMARY KEY,
    game_id UUID NOT NULL REFERENCES versus_games(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    tile_path JSONB NOT NULL,
    word VARCHAR NOT NULL
);

CREATE INDEX versus_game_submitted_words_submitted_words_game_id ON versus_game_submitted_words(game_id);

INSERT INTO versus_games (
    id, session_a_id, session_a_done, session_b_id, session_b_done, grid
)
VALUES (
    '4c35e055-fe2e-41b0-aa50-1e7cb3641ff9',
    '00000000-0000-4000-8000-000000000000',
    TRUE,
    '096c16c7-94ec-493f-8ae6-ea55a37eb730',
    TRUE,
    '[["A", "B", "C", "D"], ["E", "F", "G", "H"], ["I", "J", "K", "L"], ["M", "N", "O", "P"]]'
);

INSERT INTO versus_game_submitted_words (id, game_id, session_id, tile_path, word)
VALUES
    ('389f5115-50d1-4509-bede-8a883d5f849a', '4c35e055-fe2e-41b0-aa50-1e7cb3641ff9', '096c16c7-94ec-493f-8ae6-ea55a37eb730', '[{"x": 3, "y": 2}, {"x": 2, "y": 3}, {"x": 3, "y": 3}]', 'LOP'),
    ('ee829a23-3f66-4d9b-b5a5-a410f36374e2', '4c35e055-fe2e-41b0-aa50-1e7cb3641ff9', '00000000-0000-4000-8000-000000000000', '[{"x": 1, "y": 0}, {"x": 0, "y": 0}, {"x": 0, "y": 1}]', 'BAE'),
    ('4d0ff44c-f2d2-48f2-9e65-11de5fc6b239', '4c35e055-fe2e-41b0-aa50-1e7cb3641ff9', '00000000-0000-4000-8000-000000000000', '[{"x": 0, "y": 0}, {"x": 1, "y": 0}, {"x": 0, "y": 1}]', 'ABE'),
    ('0f66396a-ef68-4a07-bc57-4d8f018847e3', '4c35e055-fe2e-41b0-aa50-1e7cb3641ff9', '096c16c7-94ec-493f-8ae6-ea55a37eb730', '[{"x": 0, "y": 2}, {"x": 1, "y": 2}, {"x": 2, "y": 2}, {"x": 3, "y": 2}, {"x": 3, "y": 3}, {"x": 2, "y": 3}, {"x": 1, "y": 3}, {"x": 0, "y": 3}]', 'IJKLPONM');

COMMIT;
