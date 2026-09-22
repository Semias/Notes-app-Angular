-- name: CreateNote :one
INSERT INTO notes (title, content, tags, is_pinned)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetNotes :many
SELECT * FROM notes
ORDER BY is_pinned DESC, updated_at DESC;

-- name: GetNote :one
SELECT * FROM notes
WHERE id = $1 LIMIT 1;

-- name: UpdateNote :one
UPDATE notes
SET title = $2, content = $3, tags = $4, is_pinned = $5, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteNote :exec
DELETE FROM notes
WHERE id = $1;
