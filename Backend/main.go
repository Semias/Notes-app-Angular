// Command notes-backend serves the REST API behind the Angular notes app.
//
// This file is bootstrap only: read configuration, open the database, wire the
// feature modules, start the server. All request handling lives in
// internal/notes.
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"notes-backend/internal/database"
	"notes-backend/internal/notes"

	"github.com/jackc/pgx/v5/pgxpool"
)

const addr = ":5000"

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	ctx := context.Background()

	pool, err := pgxpool.New(ctx, dbURL)
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

	// Each feature module owns its own routes.
	mux := http.NewServeMux()
	notes.New(database.New(pool)).RegisterRoutes(mux)

	// The zero value of http.Server has no timeouts at all, which lets a slow or
	// idle client hold a connection open forever.
	srv := &http.Server{
		Addr:         addr,
		Handler:      corsMiddleware(mux),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("Starting Go backend server on http://localhost%s...", addr)
	log.Fatal(srv.ListenAndServe())
}
