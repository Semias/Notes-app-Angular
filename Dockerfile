# Builds the whole app into one image: the Angular frontend is compiled to
# static files and served by the Go backend, so the page and the API share one
# origin and one port. Postgres runs in its own container - deploy with
# docker-compose.yml, which wires the two together.

# --- Frontend: compile the Angular app ---
FROM node:22-alpine AS frontend
WORKDIR /src
# package-lock.json is written by npm 11. The npm 10 bundled with Node 22 treats
# its optional peer dependencies as missing and refuses to install.
RUN npm install -g npm@11.19.1
# Dependencies get their own layer, so they are only reinstalled when the lock
# file changes rather than on every source edit.
COPY Frontend/package.json Frontend/package-lock.json ./
RUN npm ci
COPY Frontend/ ./
RUN npm run build

# --- Backend: compile the Go server and the goose migration tool ---
FROM golang:1.27-alpine AS backend
WORKDIR /src
ENV CGO_ENABLED=0
COPY Backend/go.mod Backend/go.sum ./
RUN go mod download
COPY Backend/ ./
RUN go build -trimpath -ldflags="-s -w" -o /out/notes-backend .
# goose applies the migrations at container start. Pinned so a goose release
# cannot change the image unannounced; the no_* tags compile out every database
# driver except Postgres.
RUN GOBIN=/out go install -trimpath -ldflags="-s -w" \
      -tags="no_clickhouse no_libsql no_mssql no_mysql no_sqlite3 no_vertica no_ydb" \
      github.com/pressly/goose/v3/cmd/goose@v3.27.3

# --- Runtime ---
FROM alpine:3.24
WORKDIR /app
COPY --from=backend /out/ /usr/local/bin/
COPY Backend/sql/migrations/ ./migrations/
COPY --from=frontend /src/dist/notes-angular/browser/ ./public/
ENV STATIC_DIR=/app/public
USER nobody
EXPOSE 5000
# Apply outstanding migrations, then replace the shell with the server so it
# receives the container's stop signal directly.
CMD ["sh", "-c", "goose -dir /app/migrations postgres \"$DATABASE_URL\" up && exec notes-backend"]
