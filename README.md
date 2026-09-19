# Don't Stop

**Run. Capture. Defend.**

Don't Stop is a territory-running web demo for Nukus. A valid closed walking or running route can create a territory after server-side geometry, exclusion-zone, region, and anti-cheat checks.

## Current milestone

Foundation for Sprint 1:

- FastAPI API with liveness and dependency health checks;
- PostgreSQL/PostGIS and Redis via Docker Compose;
- Alembic migrations: PostGIS plus `runs`, `track_points` and solo `territories`;
- server-authoritative run pipeline: Kalman speed, rule-based activity,
  anti-cheat checks, closed-loop detection and territory capture;
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
~/projects/dont-stop
```

If you downloaded the starter as a ZIP, initialize version control once:

```bash
git init -b main
git add .
git commit -m "chore: initialize Don't Stop foundation"
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

### Renaming an existing local database

`.env.example` moved from `qrun` to `dontstop` in the 2026-09-19 rename. A
checkout that already has data does not need to be rebuilt — rename the
database and role in place, which keeps the imported exclusion polygons:

```bash
docker compose exec db psql -U qrun -d postgres   -c 'ALTER DATABASE qrun RENAME TO dontstop;'   -c 'ALTER ROLE qrun RENAME TO dontstop;'
```

Then update `POSTGRES_DB`, `POSTGRES_USER` and `DATABASE_URL` in `.env` and
restart with `docker compose up -d db api`. Dropping the `pgdata` volume
instead works too, but the OSM import has to be run again.

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

## Run flow

```text
POST /api/v1/runs/start              -> run_id
POST /api/v1/runs/{id}/points        -> batches of GPS fixes
POST /api/v1/runs/{id}/finish        -> accepted | rejected + reason
POST /api/v1/runs/{id}/abandon       -> release a run left active
GET  /api/v1/territories?bbox=...    -> GeoJSON for the map
GET  /api/v1/zones/exclusions?bbox=. -> GeoJSON of the ground no run wins
```

The browser sends coordinates, timestamps and accuracy. Speed, distance, area,
activity and ownership are all recomputed on the server. A run is accepted if
it stays inside the Nukus pilot bbox, at a walking or running pace, and passes
the anti-cheat checks.

**The runner decides the loop.** Three corners, a curve or a small yard all
count: whatever ground the walk encloses is awarded. There is no minimum or
maximum gap between the last fix and the start either - the server joins them,
reports the distance as `closing_gap_m`, and adds a `LOOP_CLOSED_BY_SERVER`
warning when the gap is wide.

This overrides TZ section 19, which specified a 300 m perimeter and a 2,000 m2
area floor. The floors are still settings, so `MIN_LOOP_PERIMETER_M`,
`MIN_AREA_M2` and `LOOP_CLOSE_TOLERANCE_M` restore the old behaviour without a
code change.

`X-Demo-User` identifies a browser and stands in for authentication. It is a
demo mechanism and must be replaced before production.

## Exclusion zones

Buildings, schools, hospitals, military and industrial land, water and
access-restricted areas are subtracted from every captured territory. Import
them for the pilot bbox from Overpass:

```bash
docker compose exec api python -m scripts.import_exclusions --dry-run
docker compose exec api python -m scripts.import_exclusions
```

The import upserts on `(source, osm_type, osm_id)`, so running it again never
creates duplicates. Only closed ways and properly assembled relations become
polygons; an open barrier is never turned into an area.

OSM coverage in Nukus is incomplete, so this is never a full picture of
private property, and the app cannot physically stop anyone entering it.

### On the map

The map draws the zones under the territory layers, coloured by kind, with a
legend that also hides them (TZ sections 9 and 12). Seeing them before a run is
the point: the ground inside a loop is still subtracted at the finish, so a
route around a block wins less than its outline suggests.

```bash
curl "http://localhost:8000/api/v1/zones/exclusions?bbox=59.600,42.445,59.620,42.460"
```

A view wider than a couple of thousand zones is capped rather than sent whole:
geometry is simplified and sub-pixel zones dropped in proportion to the bbox,
the largest 3,000 survive, and the response carries `"truncated": true` so the
legend can say to zoom in. Responses over 1 KB are gzipped, which takes the
busiest view from about 560 KB to 120 KB on the wire. TZ section 11 puts the
MVT endpoint at 20,000 visible polygons; the pilot bbox holds about 17,000, so
GeoJSON still carries it.

## Testing a real run on a phone

The Geolocation API needs a secure context and a laptop has no GPS, so a real
loop has to be walked with a phone over HTTPS:

```bash
docker compose up -d db redis api
docker compose exec api alembic upgrade head
cd frontend && npm run dev
cloudflared tunnel --url http://localhost:5173
```

Open the printed `https://*.trycloudflare.com` address on the phone, or scan
the QR card the page shows. The dev server proxies `/api` to the backend, so
the phone reaches the API through the same address.

## Development rules

- The backend is authoritative for speed, area, activity, run status, conflicts, and ownership.
- Never commit `.env`, secrets, OSM extracts, PMTiles, or trained model files.
- Exact public live location is forbidden; the public presence design uses coarse H3 cells.
- DEV-only mock tools must not be available in production builds.
- Work in small verified increments and run tests before moving to the next prompt.

Read `CLAUDE.md` before asking Claude Code to modify the project.
