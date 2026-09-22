-- +goose Up
-- This section runs when applying the migration

CREATE TABLE notes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GIN index so filtering by tag stays fast as the table grows.
CREATE INDEX notes_tags_idx ON notes USING GIN (tags);

-- +goose Down
-- This section runs when rolling back the migration

DROP TABLE notes;
