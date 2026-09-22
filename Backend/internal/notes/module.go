// Package notes contains everything belonging to the notes feature: the domain
// entity, the request DTO, the service holding business logic, and the
// controller exposing it over HTTP.
//
// The layering runs one way only:
//
//	controller  ->  service  ->  database (sqlc)
//
// The controller knows about HTTP but not about pgx; the service knows about pgx
// but not about HTTP. Adding a second feature means adding a sibling package
// shaped the same way, not extending this one.
package notes

import (
	"net/http"

	"notes-backend/internal/database"
)

// Module is the assembled notes feature. It gives main.go a single thing to
// construct, so the bootstrap never needs to know how the layers fit together.
type Module struct {
	Service    *Service
	Controller *Controller
}

// New builds the notes module on top of the generated query layer.
func New(queries *database.Queries) *Module {
	service := NewService(queries)

	return &Module{
		Service:    service,
		Controller: NewController(service),
	}
}

// RegisterRoutes attaches every notes endpoint to the given mux.
func (m *Module) RegisterRoutes(mux *http.ServeMux) {
	m.Controller.RegisterRoutes(mux)
}
