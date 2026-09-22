package notes

import "strings"

// NoteRequest is the JSON body accepted by both POST /notes and PUT /notes/{id}.
//
// PUT performs a full replacement rather than a partial patch, so both verbs take
// exactly the same shape and one type serves both. Split this into separate
// CreateRequest and UpdateRequest types if a PATCH endpoint is ever added, since
// that one would need every field to be optional.
type NoteRequest struct {
	Title    string   `json:"title"`
	Content  string   `json:"content"`
	Tags     []string `json:"tags"`
	IsPinned bool     `json:"isPinned"`
}

// Normalize cleans up a decoded request before it reaches the database.
func (r *NoteRequest) Normalize() {
	r.Title = strings.TrimSpace(r.Title)

	// An omitted or null "tags" field decodes to a nil slice, which pgx would
	// send as NULL against a NOT NULL column.
	if r.Tags == nil {
		r.Tags = []string{}
	}
}

// Validate reports whether the request is usable. Call Normalize first.
func (r NoteRequest) Validate() error {
	if r.Title == "" {
		return ErrTitleRequired
	}
	return nil
}
