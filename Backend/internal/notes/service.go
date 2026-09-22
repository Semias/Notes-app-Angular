package notes

import (
	"context"
	"errors"
	"fmt"

	"notes-backend/internal/database"

	"github.com/jackc/pgx/v5"
)

// Sentinel errors the service returns instead of HTTP status codes. The
// controller is responsible for translating these into responses, which keeps
// this layer usable from a CLI or a test without dragging net/http along.
var (
	// ErrNotFound means the requested note does not exist.
	ErrNotFound = errors.New("note not found")

	// ErrTitleRequired means the submitted note had a blank title.
	ErrTitleRequired = errors.New("title is required")
)

// Service holds the business logic for notes. It depends on the generated query
// layer and knows nothing about transport.
type Service struct {
	queries *database.Queries
}

// NewService builds a Service over the given query layer.
func NewService(queries *database.Queries) *Service {
	return &Service{queries: queries}
}

// List returns every note, pinned first, then most recently updated.
func (s *Service) List(ctx context.Context) ([]Note, error) {
	rows, err := s.queries.GetNotes(ctx)
	if err != nil {
		return nil, fmt.Errorf("list notes: %w", err)
	}
	return fromDBList(rows), nil
}

// Get returns a single note, or ErrNotFound.
func (s *Service) Get(ctx context.Context, id int64) (Note, error) {
	row, err := s.queries.GetNote(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return Note{}, ErrNotFound
	}
	if err != nil {
		return Note{}, fmt.Errorf("get note %d: %w", id, err)
	}
	return fromDB(row), nil
}

// Create stores a new note and returns it as persisted, with its generated id
// and timestamps.
func (s *Service) Create(ctx context.Context, req NoteRequest) (Note, error) {
	req.Normalize()
	if err := req.Validate(); err != nil {
		return Note{}, err
	}

	row, err := s.queries.CreateNote(ctx, database.CreateNoteParams{
		Title:    req.Title,
		Content:  req.Content,
		Tags:     req.Tags,
		IsPinned: req.IsPinned,
	})
	if err != nil {
		return Note{}, fmt.Errorf("create note: %w", err)
	}

	return fromDB(row), nil
}

// Update replaces an existing note wholesale, or returns ErrNotFound.
func (s *Service) Update(ctx context.Context, id int64, req NoteRequest) (Note, error) {
	req.Normalize()
	if err := req.Validate(); err != nil {
		return Note{}, err
	}

	row, err := s.queries.UpdateNote(ctx, database.UpdateNoteParams{
		ID:       id,
		Title:    req.Title,
		Content:  req.Content,
		Tags:     req.Tags,
		IsPinned: req.IsPinned,
	})
	// A :one query reports ErrNoRows when the WHERE matched nothing, which here
	// means the note simply does not exist.
	if errors.Is(err, pgx.ErrNoRows) {
		return Note{}, ErrNotFound
	}
	if err != nil {
		return Note{}, fmt.Errorf("update note %d: %w", id, err)
	}

	return fromDB(row), nil
}

// Delete removes a note. Deleting a note that is already gone is not an error,
// so the endpoint stays idempotent.
func (s *Service) Delete(ctx context.Context, id int64) error {
	if err := s.queries.DeleteNote(ctx, id); err != nil {
		return fmt.Errorf("delete note %d: %w", id, err)
	}
	return nil
}
