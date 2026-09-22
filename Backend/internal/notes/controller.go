package notes

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
)

// Controller translates HTTP requests into Service calls. It owns status codes,
// JSON encoding and path parsing, and contains no business logic of its own.
type Controller struct {
	service *Service
}

// NewController builds a Controller over the given service.
func NewController(service *Service) *Controller {
	return &Controller{service: service}
}

// RegisterRoutes attaches every notes endpoint to the given mux. Keeping this
// here means main.go never has to know the routing table.
func (c *Controller) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /notes", c.list)
	mux.HandleFunc("POST /notes", c.create)
	mux.HandleFunc("GET /notes/{id}", c.get)
	mux.HandleFunc("PUT /notes/{id}", c.update)
	mux.HandleFunc("DELETE /notes/{id}", c.delete)
}

// --- Handlers ---

func (c *Controller) list(w http.ResponseWriter, r *http.Request) {
	result, err := c.service.List(r.Context())
	if err != nil {
		c.fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (c *Controller) get(w http.ResponseWriter, r *http.Request) {
	id, ok := idFromPath(w, r)
	if !ok {
		return
	}

	note, err := c.service.Get(r.Context(), id)
	if err != nil {
		c.fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, note)
}

func (c *Controller) create(w http.ResponseWriter, r *http.Request) {
	req, ok := decodeRequest(w, r)
	if !ok {
		return
	}

	note, err := c.service.Create(r.Context(), req)
	if err != nil {
		c.fail(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, note)
}

func (c *Controller) update(w http.ResponseWriter, r *http.Request) {
	id, ok := idFromPath(w, r)
	if !ok {
		return
	}

	req, ok := decodeRequest(w, r)
	if !ok {
		return
	}

	note, err := c.service.Update(r.Context(), id, req)
	if err != nil {
		c.fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, note)
}

func (c *Controller) delete(w http.ResponseWriter, r *http.Request) {
	id, ok := idFromPath(w, r)
	if !ok {
		return
	}

	if err := c.service.Delete(r.Context(), id); err != nil {
		c.fail(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// --- Error translation ---

// fail maps a service error onto the matching HTTP response. Unrecognised errors
// are logged in full and reported generically, so internal detail never reaches
// the client.
func (c *Controller) fail(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrNotFound):
		http.Error(w, "Note not found", http.StatusNotFound)
	case errors.Is(err, ErrTitleRequired):
		http.Error(w, "Title is required", http.StatusBadRequest)
	default:
		log.Printf("notes: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

// --- Request helpers ---

// decodeRequest reads the JSON body, writing a 400 itself if it is unreadable.
func decodeRequest(w http.ResponseWriter, r *http.Request) (NoteRequest, bool) {
	var req NoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return req, false
	}
	return req, true
}

// idFromPath reads the {id} wildcard, writing a 400 itself if it is not numeric.
func idFromPath(w http.ResponseWriter, r *http.Request) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		http.Error(w, "Note id must be a number", http.StatusBadRequest)
		return 0, false
	}
	return id, true
}

// writeJSON encodes a payload with the right content type and status.
func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("notes: write response: %v", err)
	}
}
