package main

import "net/http"

// frontendOrigin is where the Angular dev server runs.
const frontendOrigin = "http://localhost:4200"

// corsMiddleware adds the CORS headers the browser requires and answers
// preflight requests directly. It wraps the whole mux rather than living in a
// feature package, since it applies to every route the server exposes.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", frontendOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
