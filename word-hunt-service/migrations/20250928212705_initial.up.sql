BEGIN;

CREATE TYPE game_mode AS ENUM ('versus', 'solo', 'solve');

CREATE TABLE IF NOT EXISTS games(
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    creator_id UUID NOT NULL,
    competitor_id UUID,
    game_mode game_mode NOT NULL,
    grid JSONB NOT NULL
);

CREATE INDEX games_creator_id ON games (creator_id);
CREATE INDEX games_competitor_id ON games (competitor_id);

CREATE INDEX games_awaiting_competitor
ON games (created_at)
WHERE competitor_id IS NULL
AND game_mode = 'versus';

COMMIT;
