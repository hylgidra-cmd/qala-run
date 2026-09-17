# QalaRun

**Run. Capture. Defend.**

QalaRun is a territory-running web demo for Nukus. A valid closed walking or running route can create a territory after server-side geometry, exclusion-zone, region, and anti-cheat checks.

## Current milestone

Foundation for Sprint 1:

- FastAPI API with liveness and dependency health checks;
- PostgreSQL/PostGIS and Redis via Docker Compose;
- Alembic with the initial PostGIS migration (`region_boundaries`, `exclusion_zones`);
- React + TypeScript + MapLibre frontend;
- Nukus pilot bounds and OpenFreeMap Positron basemap;
- Claude Code instructions and implementation prompts.

## Requirements

- Node.js 24 LTS (the selected patch is in `.nvmrc`)
- Python 3.12
- Docker Desktop with WSL2 on Windows
- Git

On Windows, keep this project in the WSL filesystem, for example:

```bash
~/projects/qalarun
```

If you downloaded the starter as a ZIP, initialize version control once:

```bash
git init -b main
git add .
git commit -m "chore: initialize QalaRun foundation"
```

## Start infrastructure and API

```bash
cp .env.example .env
docker compose up -d db redis api
docker compose exec api alembic upgrade head
curl http://localhost:8000/health/live
curl http://localhost:8000/health
```

## Database migrations

Alembic lives in `backend/alembic`, and the connection string comes from
`DATABASE_URL` through `app.config` — never from `alembic.ini`.

```bash
docker compose exec api alembic current
docker compose exec api alembic upgrade head
docker compose exec api alembic downgrade base
```

## Backend tests

The schema tests need the database, so run them inside the API container.
On the host they skip with a message instead of failing.

```bash
docker compose exec api python -m pytest tests -q
docker compose exec api ruff check .
```

## Start frontend

```bash
cd frontend
npm ci
npm run dev
```

Open <http://localhost:5173>.

## Development rules

- The backend is authoritative for speed, area, activity, run status, conflicts, and ownership.
- Never commit `.env`, secrets, OSM extracts, PMTiles, or trained model files.
- Exact public live location is forbidden; the public presence design uses coarse H3 cells.
- DEV-only mock tools must not be available in production builds.
- Work in small verified increments and run tests before moving to the next prompt.

Read `CLAUDE.md` before asking Claude Code to modify the project.
