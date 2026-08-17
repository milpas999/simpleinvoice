# SimpleInvoice

A full-stack invoicing application built for the 101 Digital Web Engineer Assessment. See [`requirements.md`](./requirements.md) for the full specification.

## 1. Overview & Architecture

SimpleInvoice is organized as a **monorepo** with two independent applications and a shared Docker Compose stack:

```
codebase/
├── backend/            # NestJS API (TypeScript)
├── frontend/           # React + TypeScript app (Vite)
├── docker-compose.yml  # Single-command orchestration for db + backend + frontend
├── .env.example         # All required environment variable keys (no real secrets)
└── requirements.md      # Assessment specification
```

| Layer    | Stack                                                              |
| -------- | ------------------------------------------------------------------- |
| Frontend | React 19 + TypeScript, built/served with Vite                      |
| Backend  | NestJS (TypeScript), REST API, documented with `@nestjs/swagger`   |
| Database | PostgreSQL, accessed via TypeORM (migrations + seed script)        |
| Auth     | JWT (JSON Web Tokens), stateless session management                |

A monorepo (rather than two separate repos) was chosen so the whole stack — frontend, backend, and infrastructure — can be reviewed and run from a single clone with one `docker compose up`.

> **Project status:** this repository currently contains the application scaffolding and the full Docker/local dev environment (this PR). The database schema, TypeORM integration, authentication, invoice endpoints, and seed script are being implemented next — see [Known Limitations](#7-known-limitations--incomplete-features) below.

## 2. Prerequisites

- **With Docker (recommended):** [Docker](https://docs.docker.com/get-docker/) with Compose v2 (`docker compose version`)
- **Without Docker:** Node.js 20+, npm, and a local PostgreSQL 16 instance

## 3. Environment Configuration

All configuration and secrets are sourced from a **single root-level `.env` file** — never hardcoded in source. Nothing is committed with real secrets; `.env` is git-ignored and `.env.example` documents every required key.

```bash
cp .env.example .env
```

| Variable            | Used by           | Description                                              |
| -------------------- | ------------------ | ---------------------------------------------------------- |
| `NODE_ENV`           | backend            | `development` \| `production`                             |
| `POSTGRES_USER`      | db                 | Postgres superuser created on first boot                  |
| `POSTGRES_PASSWORD`  | db                 | Postgres password                                          |
| `POSTGRES_DB`        | db                 | Database name created on first boot                       |
| `POSTGRES_PORT`      | db (host mapping)  | Host port Postgres is published on (default `5432`)        |
| `BACKEND_PORT`       | backend (host mapping) | Host port the API is published on (default `3000`)     |
| `DB_HOST`            | backend            | DB host for TypeORM. Ignored by docker-compose (always `db` inside the network) — used when running the backend outside Docker |
| `DB_PORT`            | backend            | DB port for TypeORM (default `5432`)                        |
| `DB_USERNAME`        | backend            | DB user for TypeORM (outside Docker; mirrors `POSTGRES_USER` in Docker) |
| `DB_PASSWORD`        | backend            | DB password for TypeORM (outside Docker)                    |
| `DB_NAME`            | backend            | DB name for TypeORM (outside Docker)                         |
| `JWT_SECRET`         | backend            | Secret used to sign JWT access tokens                       |
| `JWT_EXPIRES_IN`     | backend            | Access token lifetime in seconds (defaults to `3600`)       |
| `FRONTEND_PORT`      | frontend (host mapping) | Host port the frontend dev server is published on (default `5173`) |
| `VITE_API_BASE_URL`  | frontend           | Base URL the browser uses to call the backend API           |

## 4. Running with Docker (single command)

From the project root, with a `.env` file in place:

```bash
docker compose up
# or, after changing a Dockerfile or dependencies:
docker compose up --build
```

This brings up three containers on a shared network:

1. `db` — PostgreSQL, with a named volume for persistent data
2. `backend` — NestJS API, source bind-mounted from `./backend`, running `npm run start:dev`
3. `frontend` — Vite dev server, source bind-mounted from `./frontend`, running `npm run dev`

**Live reload:** both `backend` and `frontend` bind-mount their source directories into the container (with `node_modules` kept in a separate named volume so the container's own install isn't shadowed by the host's). Any file you edit on the host is immediately reflected inside the container, and Nest's `--watch` / Vite's HMR restart or hot-swap the app automatically — no rebuild needed for code changes. File watching is forced into polling mode (`CHOKIDAR_USEPOLLING`, `TSC_WATCHFILE`, Vite's `usePolling`) so this works reliably on Docker Desktop for Windows/macOS, where native filesystem change events don't always propagate into bind mounts.

Stop the stack with `docker compose down` (add `-v` to also delete the Postgres data volume).

Each service has its own multi-stage `Dockerfile` (`backend/Dockerfile`, `frontend/Dockerfile`) with `development`, `build`, and `production` stages. Compose uses the `development` target; the `production` stage (backend: compiled `dist/` on a slim Node runtime; frontend: static build served by nginx) is available for a production-style build via `docker build --target production`.

**Health checks:** all three services define a Compose `healthcheck`, and startup ordering depends on it — `backend` waits for `db` to be healthy, and `frontend` waits for `backend` to be healthy, so `docker compose up` won't route traffic to a service before its dependency is actually ready:

| Service  | Check                                              |
| -------- | ---------------------------------------------------- |
| db       | `pg_isready` against the configured user/database     |
| backend  | `GET /health` (unauthenticated, returns `{ "status": "ok" }`) |
| frontend | `GET /` against the Vite dev server                    |

Run `docker compose ps` to see live health status.

### Exposed ports

| Service  | Container port | Host port (default)      | URL                              |
| -------- | --------------- | -------------------------- | ----------------------------------- |
| frontend | 5173            | `${FRONTEND_PORT}` (5173)  | http://localhost:5173               |
| backend  | 3000            | `${BACKEND_PORT}` (3000)   | http://localhost:3000               |
| backend health check | 3000 | `${BACKEND_PORT}` (3000)  | http://localhost:3000/health        |
| backend Swagger docs | 3000 | `${BACKEND_PORT}` (3000)  | http://localhost:3000/api/docs *(planned)* |
| db (PostgreSQL) | 5432     | `${POSTGRES_PORT}` (5432)  | `localhost:5432` (via any Postgres client) |

All host ports are configurable via the root `.env` file.

## 5. Running without Docker

**Database:** install PostgreSQL 16 locally (or point at any reachable instance) and create a database matching `POSTGRES_DB`/`DB_NAME`.

**Backend:**

```bash
cd backend
npm install
cp ../.env.example .env   # or reuse the root .env; ensure DB_HOST=localhost
npm run start:dev         # http://localhost:3000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

## 6. Database Seeding *(planned)*

The backend will ship a seed script, runnable with a single command once the database layer is implemented:

```bash
cd backend
npm run seed
```

This will populate the database with a default reviewer user account (credentials to be documented here) and a diverse set of sample invoices (Draft, Pending, Paid, with varied dates/amounts) per the mock dataset in `requirements.md` Appendix A.

## 7. Known Limitations / Incomplete Features

This submission currently covers project scaffolding and the full Docker/local development environment. Not yet implemented:

- TypeORM entities, database schema, and migrations
- Authentication (`/auth/login`, `/auth/me`) and JWT guards
- Invoice endpoints (list/detail/create) and business logic (totals, Overdue derivation)
- Database seed script (`npm run seed`) and default reviewer credentials
- Swagger/OpenAPI documentation at `/api/docs`
- Frontend screens (login, invoice list, invoice detail, create invoice)
- Unit and integration/e2e tests

## 8. Assumptions & Design Decisions

- **Monorepo** structure was chosen over two separate repositories, per the suggested layout in `requirements.md` §2.4.1, to keep the app and its Docker orchestration reviewable from a single clone.
- Docker Compose targets each service's `development` build stage by default (bind-mounted source + hot reload) to optimize for local iteration; `production` stages are provided in each Dockerfile for a production-style build/deploy path.
- A single root-level `.env` is the source of truth for all services in Docker; `DB_HOST` inside the compose network is fixed to the `db` service name regardless of `.env`, since that value is only meaningful for local (non-Docker) runs.
