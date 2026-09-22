package notes

import (
	"time"

	"notes-backend/internal/database"
)

// Note is the domain representation of a note, and the shape the API returns.
//
// It is deliberately kept separate from database.Note. The sqlc-generated struct
// is a persistence detail that changes whenever the schema does; if it doubled as
// the wire format, every column rename would silently become a breaking API
// change for the Angular client.
type Note struct {
	ID        int64     `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Tags      []string  `json:"tags"`
	IsPinned  bool      `json:"isPinned"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// fromDB maps a generated database row onto the domain entity.
func fromDB(row database.Note) Note {
	// tags is NOT NULL in the schema, but guard anyway so the JSON is always an
	// array rather than null.
	tags := row.Tags
	if tags == nil {
		tags = []string{}
	}

	return Note{
		ID:        row.ID,
		Title:     row.Title,
		Content:   row.Content,
		Tags:      tags,
		IsPinned:  row.IsPinned,
		CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt,
	}
}

// fromDBList maps a set of rows, always returning a non-nil slice so an empty
// table encodes as [] instead of null.
func fromDBList(rows []database.Note) []Note {
	result := make([]Note, 0, len(rows))
	for _, row := range rows {
		result = append(result, fromDB(row))
	}
	return result
}
