// Used by ng serve and ng test. In development the Go server runs on its own
// port, so API calls are cross-origin (allowed by Backend/middleware.go).
export const environment = {
  apiUrl: 'http://localhost:5000',
};
