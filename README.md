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
| Frontend | React 19 + TypeScript (Vite), Redux Toolkit, React Hook Form + Zod  |
| Backend  | NestJS (TypeScript), REST API, documented with `@nestjs/swagger`   |
| Database | PostgreSQL, accessed via TypeORM (migrations + seed script)        |
| Auth     | JWT (JSON Web Tokens), stateless session management                |

A monorepo (rather than two separate repos) was chosen so the whole stack — frontend, backend, and infrastructure — can be reviewed and run from a single clone with one `docker compose up`.

**Backend**: `auth` (login, JWT strategy/guard, `/auth/me`), `users`, `invoices` (list/detail/create, search/filter/sort/pagination, server-side totals, Overdue derivation), `common` (global exception filter, shared validators), and `database` (TypeORM data source, one baseline migration, seed script) — each a self-contained Nest module.

**Frontend**: all four screens (Login, Invoice List, Invoice Detail, Create Invoice) are wired to the real API via a Redux Toolkit store (`authSlice`, `invoicesSlice`, classic `createAsyncThunk` pattern) and an Axios client that attaches the JWT and handles session expiry. Forms use React Hook Form + Zod.

## 2. Prerequisites

- **With Docker (recommended):** [Docker](https://docs.docker.com/get-docker/) with Compose v2 (`docker compose version`)
- **Without Docker:** Node.js 20+, npm, and a local PostgreSQL 16 instance

## 3. Environment Configuration

All configuration and secrets are sourced from environment variables — never hardcoded in source. Nothing is committed with real secrets; `.env` files are git-ignored and `.env.example` files document every required key.

**Docker Compose** reads a single root-level `.env`:

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

**Running a service outside Docker** additionally needs its own `.env` (Vite and a locally-run Nest process don't read the root `.env`):

```bash
cp .env.example backend/.env    # adjust DB_HOST=localhost
cp frontend/.env.example frontend/.env
```

## 4. Running with Docker (single command)

From the project root, with a `.env` file in place:

```bash
docker compose up # modern Docker
# or
docker-compose up # legacy Docker Compose
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
| backend Swagger docs | 3000 | `${BACKEND_PORT}` (3000)  | http://localhost:3000/api/docs      |
| db (PostgreSQL) | 5432     | `${POSTGRES_PORT}` (5432)  | `localhost:5432` (via any Postgres client) |

All host ports are configurable via the root `.env` file.

## 5. Running without Docker

**Database:** install PostgreSQL 16 locally (or point at any reachable instance) and create a database matching `POSTGRES_DB`/`DB_NAME`.

**Backend:**

```bash
cd backend
npm install
cp ../.env.example .env   # ensure DB_HOST=localhost
npm run start:dev         # http://localhost:3000
```

**Frontend:**

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_BASE_URL=http://localhost:3000
npm run dev                # http://localhost:5173
```

## 6. Database Seeding

The backend ships a seed script, runnable with a single command:

```bash
cd backend
npm run seed
# or, with the stack running under Docker:
docker compose exec backend npm run seed
```

This populates the database with:

- A default **reviewer** user account (see [Reviewer credentials](#reviewer-credentials) below).
- The Appendix A sample invoice (`IV1780488206995`), persisted with status `Pending` — its documented `"Overdue"` status in the spec is itself a derived display value (see §2.3.2), so the closest valid persisted status is used.
- 30 additional invoices with a randomized-but-deterministic mix of statuses (`Draft`/`Pending`/`Paid`), dates (including past-due ones, so Overdue derivation is visible), amounts, and customers.

The script is idempotent — re-running it skips any invoice number that already exists, so `npm run seed` is safe to run more than once.

### Reviewer credentials

| Email                          | Password        |
| ------------------------------- | ---------------- |
| `reviewer@simpleinvoice.dev`    | `Reviewer123!`   |

Overridable via the `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` environment variables if you want different seeded credentials.

## 7. Running Tests

**Backend** (`cd backend`):

```bash
npm test           # unit tests (Jest) — no database required
npm run test:e2e   # e2e tests (Jest + Supertest) — requires a reachable Postgres,
                    # e.g. `docker compose up -d db`, using the same env vars as a
                    # non-Docker backend run
```

Unit tests cover the server-side total calculation formulas, Overdue status derivation, due-date validation, and unique-invoice-number enforcement. The e2e suite covers the full "create an invoice → it appears in the list → its detail view matches" workflow, plus 409/401 error responses.

**Frontend** (`cd frontend`):

```bash
npm test        # Vitest + React Testing Library
```

Covers login form validation/submission, create-invoice form validation and duplicate-invoice-number error mapping, invoice list rendering against a mocked API response, and protected-route redirect behavior.

## 8. API Documentation

Swagger/OpenAPI docs are generated automatically via `@nestjs/swagger` and served at **`/api/docs`** (e.g. http://localhost:3000/api/docs) whenever the backend is running. All endpoints — including the value-add `POST /invoices/calculate-totals` preview endpoint — are documented with request/response schemas, query parameters, and status codes; use the "Authorize" button with a token from `POST /auth/login` to try protected routes directly from the UI.

## 9. Database Migrations

Local development relies on TypeORM's `synchronize: NODE_ENV !== 'production'` (see `backend/src/app.module.ts`) to auto-create tables from the entity definitions — no manual migration step is needed to run `docker compose up` or `npm run seed`.

For production-style deployments, a hand-written baseline migration is provided (`backend/src/database/migrations/`) as the reviewable, explicit schema-change path:

```bash
cd backend
npm run migration:run      # apply migrations
npm run migration:generate -- src/database/migrations/SomeChange  # generate a new one
npm run migration:revert   # roll back the last migration
```

This migration is **not** run automatically by `docker compose up` or the seed script — it exists for documentation and as the intended production path, not the local dev flow.

## 10. Assumptions & Design Decisions

- **Monorepo** structure was chosen over two separate repositories, per the suggested layout in `requirements.md` §2.4.1, to keep the app and its Docker orchestration reviewable from a single clone.
- **Customer data is embedded** on the `invoices` table (`customer_fullname`, `customer_email`, `customer_mobile_number`, `customer_address`) rather than a separate `customers` table — both are explicitly acceptable per `requirements.md` §3.2, and embedding keeps list/detail queries simple for this assessment's scope (no customer reuse/listing feature is required).
- **Frontend state management** uses Redux Toolkit with the classic `createSlice` + `createAsyncThunk` pattern (not RTK Query) alongside a plain Axios client, per the intended architecture for this build — chosen over `@tanstack/react-query` to keep all server-state handling under the Redux Toolkit umbrella.
- **Schema management**: TypeORM `synchronize` handles table creation in development (fast, zero-setup, fits the "single command" packaging goal); a hand-written baseline migration is provided separately for production-readiness (see [§9](#9-database-migrations)) but is not part of the dev/Docker flow.
- **No global API prefix**: endpoints are served at the bare paths shown in `requirements.md` §2.3.1 (e.g. `/auth/login`, `/invoices`) rather than under `/api`, so the existing `/health` Docker healthcheck and the documented endpoint paths both work without adjustment. Swagger is still mounted at `/api/docs`, which is just a literal path independent of any global prefix.
- **`fromDate`/`toDate` filter `invoiceDate`**, not `dueDate` — the query parameter table in `requirements.md` §2.3.1 doesn't specify which date field these filter, and `invoiceDate` (when the invoice was issued) was judged the more natural default for a date-range filter on an invoice list.
- **CORS** is enabled for the frontend's local dev origin(s) (`http://localhost:5173` / `FRONTEND_PORT`) directly in `main.ts`, rather than introducing an additional environment variable, since the assessment's Docker/local setup only ever serves the frontend from one of those origins.
- **JWT storage**: the frontend stores the access token in `localStorage` and attaches it via an Axios request interceptor; a 401 response clears the token and returns the user to the login screen. This is the standard approach for a stateless bearer-token API without a same-site cookie/CSRF story to manage.
- Docker Compose targets each service's `development` build stage by default (bind-mounted source + hot reload) to optimize for local iteration; `production` stages are provided in each Dockerfile for a production-style build/deploy path.
- A single root-level `.env` is the source of truth for all services in Docker; `DB_HOST` inside the compose network is fixed to the `db` service name regardless of `.env`, since that value is only meaningful for local (non-Docker) runs.
- **`POST /invoices/calculate-totals`** (value add, JWT-protected like the rest of `/invoices`): per `requirements.md` §2.1.4/§2.3.2, "Total amount must be calculated by the backend, not the frontend." The Create Invoice form's live summary panel now debounces user input and calls this endpoint for the subtotal/tax/total/balance preview, instead of duplicating the formula in browser JS — so even the in-progress preview, not just the final save, is server-computed. It shares the same `calculateTotals()` utility used by `POST /invoices` to avoid formula drift between the two.

## 11. Known Limitations / Incomplete Features

- Each invoice supports exactly one line item (the data model — `invoice_items` as a real one-to-many table — supports more, per `requirements.md` §2.1.4, but no UI/API exists yet to add a second item to an existing invoice).
- No password reset, refresh tokens, or multi-factor authentication (explicitly out of scope per `requirements.md` §2.1.1).
- No rate limiting on the `/auth/login` endpoint.
- Invoice list search matches invoice number and customer name only (no line-item name search).
- No pagination/virtualization tuning beyond the documented `page`/`pageSize` contract — very large result sets are not specifically optimized for.
