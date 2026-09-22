# Notes App: Complete Go Backend Implementation Guide

> **Status: implemented.** This document records how the backend was built and
> why each decision was made. For day-to-day commands — running the server,
> creating and applying migrations, regenerating `sqlc` — see
> [`Backend/README.md`](../../Backend/README.md), which is the living reference.
>
> One thing here is deliberately out of date: section 4 below presents the API as
> a single `main.go`. The shipped code splits that into a layered `internal/notes`
> module (controller → service → entity/DTO). The handler logic is unchanged; only
> its arrangement differs. `Backend/README.md` documents the final structure.

This document serves as the comprehensive implementation guide for replacing `json-server` with a production-ready Go backend. It walks through setting up the Go module, configuring database migrations with `goose`, generating type-safe database queries with `sqlc`, and wiring up the REST API using Go 1.22's enhanced standard library routing.

## 1. Prerequisites and Project Initialization

Before writing code, ensure you have Go 1.22 (or later) installed, as this implementation relies on the new HTTP routing features introduced in 1.22.

Go is not currently installed on this machine. Install it first:

```powershell
winget install GoLang.Go
```

Then open a **new** terminal so `go` is on your `PATH`, and confirm with `go version`.

Run these commands in your designated `Backend/` directory:

```bash
# Initialize the Go module
go mod init notes-backend

# Install the Postgres driver (pgx)
# pgx is the recommended, high-performance PostgreSQL driver for Go
go get github.com/jackc/pgx/v5/pgxpool

# Install CLI tools for migrations and query generation
# (Run these if they aren't already installed globally on your machine)
go install github.com/pressly/goose/v3/cmd/goose@latest
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
```

## 2. Database Schema and Migrations (Goose)

We use `goose` for database migrations because it allows us to write plain SQL migrations without learning a Go-specific migration DSL.

### Create the Migration File

First, create a directory for your migrations:
```bash
mkdir -p sql/migrations
```

Create your first migration file at `sql/migrations/001_create_notes_table.sql`:

```sql
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

-- GIN index so filtering by tag stays fast as the table grows
-- (planned for v2.0: "allow filtering by clicking a tag").
CREATE INDEX notes_tags_idx ON notes USING GIN (tags);

-- +goose Down
-- This section runs when rolling back the migration

DROP TABLE notes;
```

> **Why `BIGINT` and not `UUID`.** The Angular client types the primary key as a
> number — `id?: number` in `src/app/Note.ts` — and the existing `db.json` data
> uses integer ids. A UUID key would silently make that type declaration false.
> Since the whole point of this backend is to be a drop-in replacement for
> `json-server`, the integer identity column keeps the frontend untouched. Switch
> to `UUID DEFAULT gen_random_uuid()` later if you ever need client-generated ids
> or want to stop exposing a guessable sequence — just update `Note.ts` in the
> same commit.

> **On the `updated_at` trigger.** A `BEFORE UPDATE` trigger calling a plpgsql
> function is the usual way to maintain this column, and it was deliberately left
> out here for two reasons. It would be redundant — the `UpdateNote` query below
> already sets `updated_at = NOW()` explicitly — and `sqlc` reads this same
> directory as its schema source, where dollar-quoted plpgsql bodies are a common
> cause of parse failures. Since the API is the only writer to this table, the
> explicit `SET` is enough. Add the trigger back if you ever start updating rows
> from `psql` or another service.

### Apply the Migration

With the Docker Postgres container running, apply the migration. The connection
string below matches the values already in `Backend/.env` — user `admin`,
database `notes_db`, port 5432:

```bash
GOOSE_DRIVER=postgres \
GOOSE_DBSTRING="postgres://admin:$POSTGRES_PASSWORD@localhost:5432/notes_db?sslmode=disable" \
goose -dir sql/migrations up
```

`sslmode=disable` is correct here and only here: the database is reachable only
on localhost from the container's published port. Any deployed environment needs
`sslmode=require` or stricter.

Since you will type this repeatedly, define it once in `Backend/.env` instead:

```bash
DATABASE_URL=postgres://admin:0FlgXncTptbJ201p9mCFWcJ@localhost:5432/notes_db?sslmode=disable
```

That file is already git-ignored, and `main.go` reads the same variable below.

---

## 3. Type-Safe Data Access Layer (sqlc)

`sqlc` parses your raw SQL queries and generates type-safe Go structs and functions, completely eliminating the need for an ORM while maintaining compile-time safety.

### Configure sqlc

Create a `sqlc.yaml` file in the root of your `Backend/` directory:

```yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "sql/queries.sql"
    schema: "sql/migrations/"
    gen:
      go:
        package: "database"
        out: "internal/database"
        # Tell sqlc to generate code compatible with pgx/v5
        sql_package: "pgx/v5"

        # Without these two, sqlc emits structs with no JSON tags at all, so the
        # API would serialize PascalCase keys - {"ID":1,"Title":"..."} - and
        # every field would read as undefined in the Angular client. Camel case
        # gives id / title / tags / isPinned, matching the Note interface.
        emit_json_tags: true
        json_tags_case_style: "camel"

        # :many queries return an empty slice rather than nil, so an empty table
        # encodes as [] instead of null.
        emit_empty_slices: true

        overrides:
          # By default timestamptz maps to pgtype.Timestamptz, which serializes
          # as {"Time":"...","Valid":true} rather than a plain ISO-8601 string.
          - db_type: "timestamptz"
            go_type: "time.Time"
```

> These four settings are the difference between an API the Angular app can read
> and one it silently cannot. They are easy to skip because the Go side compiles
> and the endpoints return `200` either way — the breakage only shows up as blank
> notes in the browser.

### Define SQL Queries

Create the file `sql/queries.sql`. These are the exact queries the API will use to interact with the database:

```sql
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
```

### Generate Go Code

Run the following command in your terminal:
```bash
sqlc generate
```
This will read your schema and queries, and automatically create a highly optimized, type-safe data access layer inside the `internal/database/` directory.

---

## 4. API & Routing (main.go)

Now we wire everything together. Go 1.22 introduced method-specific routing (e.g., `GET /path`) directly in the standard library's `http.ServeMux`.

Create `main.go` in the root of your backend directory:

```go
package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"notes-backend/internal/database"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ApiConfig holds our database connection so our HTTP handlers can access it
type ApiConfig struct {
	DB *database.Queries
}

func main() {
	// 1. Connect to PostgreSQL via pgx connection pool
	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	ctx := context.Background()

	pool, err := pgxpool.New(ctx, dbUrl)
	if err != nil {
		log.Fatalf("Unable to configure database pool: %v", err)
	}
	defer pool.Close()

	// pgxpool.New only parses the URL - it does not open a connection. Ping here
	// so a wrong password or a stopped container fails at startup with a clear
	// message, instead of on whichever request happens to arrive first.
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("Unable to reach database: %v", err)
	}

	// Initialize our typed database access from sqlc
	apiCfg := &ApiConfig{
		DB: database.New(pool),
	}

	// 2. Setup Router using Go 1.22 features
	mux := http.NewServeMux()

	// Endpoints matching the frontend Angular contract
	mux.HandleFunc("GET /notes", apiCfg.handleGetNotes)
	mux.HandleFunc("POST /notes", apiCfg.handleCreateNote)
	mux.HandleFunc("GET /notes/{id}", apiCfg.handleGetNote)
	mux.HandleFunc("PUT /notes/{id}", apiCfg.handleUpdateNote)
	mux.HandleFunc("DELETE /notes/{id}", apiCfg.handleDeleteNote)

	// 3. Start the server with explicit timeouts. The zero value of http.Server
	// has none, which lets a slow or idle client hold a connection open forever.
	srv := &http.Server{
		Addr:         ":5000",
		Handler:      corsMiddleware(mux),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("Starting Go backend server on http://localhost%s...", srv.Addr)
	log.Fatal(srv.ListenAndServe())
}

// --- Helpers ---

// noteParams is the JSON body the Angular client sends for create and update.
type noteParams struct {
	Title    string   `json:"title"`
	Content  string   `json:"content"`
	Tags     []string `json:"tags"`
	IsPinned bool     `json:"isPinned"`
}

func decodeNote(w http.ResponseWriter, r *http.Request) (noteParams, bool) {
	var params noteParams
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return params, false
	}

	// tags is NOT NULL in the schema, but an omitted or null "tags" field decodes
	// to a nil slice, which pgx would send as NULL and Postgres would reject.
	if params.Tags == nil {
		params.Tags = []string{}
	}

	return params, true
}

func idFromPath(w http.ResponseWriter, r *http.Request) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		http.Error(w, "Note id must be a number", http.StatusBadRequest)
		return 0, false
	}
	return id, true
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("write response: %v", err)
	}
}

// --- Handlers ---

func (api *ApiConfig) handleGetNotes(w http.ResponseWriter, r *http.Request) {
	// emit_empty_slices in sqlc.yaml means this is [] rather than nil when the
	// table is empty, so it encodes as [] and not null.
	notes, err := api.DB.GetNotes(r.Context())
	if err != nil {
		log.Printf("get notes: %v", err)
		http.Error(w, "Failed to fetch notes", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, notes)
}

func (api *ApiConfig) handleGetNote(w http.ResponseWriter, r *http.Request) {
	id, ok := idFromPath(w, r)
	if !ok {
		return
	}

	note, err := api.DB.GetNote(r.Context(), id)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Note not found", http.StatusNotFound)
		return
	}
	if err != nil {
		log.Printf("get note %d: %v", id, err)
		http.Error(w, "Failed to fetch note", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, note)
}

func (api *ApiConfig) handleCreateNote(w http.ResponseWriter, r *http.Request) {
	params, ok := decodeNote(w, r)
	if !ok {
		return
	}

	// Create note using generated sqlc function
	note, err := api.DB.CreateNote(r.Context(), database.CreateNoteParams{
		Title:    params.Title,
		Content:  params.Content,
		Tags:     params.Tags,
		IsPinned: params.IsPinned,
	})
	if err != nil {
		log.Printf("create note: %v", err)
		http.Error(w, "Failed to create note", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, note)
}

func (api *ApiConfig) handleUpdateNote(w http.ResponseWriter, r *http.Request) {
	id, ok := idFromPath(w, r)
	if !ok {
		return
	}

	params, ok := decodeNote(w, r)
	if !ok {
		return
	}

	note, err := api.DB.UpdateNote(r.Context(), database.UpdateNoteParams{
		ID:       id,
		Title:    params.Title,
		Content:  params.Content,
		Tags:     params.Tags,
		IsPinned: params.IsPinned,
	})
	// A :one query returns ErrNoRows when the WHERE matched nothing, which here
	// means the note does not exist - a 404, not a server error.
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Note not found", http.StatusNotFound)
		return
	}
	if err != nil {
		log.Printf("update note %d: %v", id, err)
		http.Error(w, "Failed to update note", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, note)
}

func (api *ApiConfig) handleDeleteNote(w http.ResponseWriter, r *http.Request) {
	id, ok := idFromPath(w, r)
	if !ok {
		return
	}

	if err := api.DB.DeleteNote(r.Context(), id); err != nil {
		log.Printf("delete note %d: %v", id, err)
		http.Error(w, "Failed to delete note", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// --- Middleware ---

// corsMiddleware intercepts requests to add CORS headers and immediately responds to OPTIONS requests
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow Angular frontend (localhost:4200)
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:4200")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
```

## 5. Running the Application

1. Make sure your Docker Postgres container is up and running:
   ```bash
   docker compose -f Backend/docker-compose.yml up -d
   ```
2. Confirm the database migration has been applied successfully.
3. Confirm `sqlc generate` has populated `internal/database/`.
4. Start the server:
   ```bash
   go run main.go
   ```
5. You should see `Starting Go backend server on http://localhost:5000...`.
6. Verify the API answers before touching the frontend:
   ```bash
   curl http://localhost:5000/notes
   curl -X POST http://localhost:5000/notes \
     -H "Content-Type: application/json" \
     -d '{"title":"First","content":"Hello","tags":["demo"]}'
   ```
   The second call should return a note with a numeric `id` and **lowercase**
   keys. If you see `{"ID":1,"Title":...}` instead, the `emit_json_tags` settings
   in `sqlc.yaml` did not take effect — fix that and re-run `sqlc generate`.

## 6. Switching the Frontend Over

`note.service.ts` already points at `http://localhost:5000/notes`, so `getNotes`,
`addNote` and `deleteNote` work against this backend with no change at all.

Two follow-ups remain on the Angular side:

- **Retire `json-server`.** Drop the `"server"` script from `Frontend/package.json`
  and uninstall the dependency. `db.json` can go with it once you no longer need
  the sample data.
- **Extend the `Note` interface** in `src/app/Note.ts` to match what the API now
  returns, so the new columns are usable:

  ```typescript
  export interface Note {
    id?: number;
    title: string;
    tags: string[];
    content: string;
    isPinned?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }
  ```

  These are optional so existing call sites keep compiling. `PUT /notes/{id}` is
  now live, which unblocks the edit feature (Step 5 of the v2.0 plan) — it needs
  an `updateNote` method added to `NoteService`.
