# Deploying the Don't Stop web demo

## What is deployed

There are two deployment targets, and they are not equivalent.

**Render (`render.yaml`) deploys the whole stack**: a PostGIS database, a Redis
key-value store, the FastAPI backend as a Docker service and the frontend as a
static site. `preDeployCommand` runs `alembic upgrade head` before each deploy.
The static site is built with an absolute `VITE_API_URL`, and the API allows
that origin through `CORS_ORIGINS`.

**GitHub Pages deploys the frontend only.** It has no backend, so the run panel
says plainly that no API is reachable and the page is map-only.

### What is deployed today

The 2026-09-19 rename to **Don't Stop** changed `render.yaml` but not Render
itself, so the live resources still carry the old names until they are migrated
by hand.

| Resource in `render.yaml` | Live on Render today | Address |
|---|---|---|
| `dontstop-web` (static site) | `qalarun-web` | https://qalarun-web.onrender.com |
| `dontstop-api` (Docker) | `qalarun-api` | https://qalarun-api.onrender.com |
| `dontstop-db` (Postgres 16 + PostGIS) | `qalarun-db` | internal only |
| `dontstop-redis` (Key Value) | `qalarun-redis` | internal only |

All four are in Frankfurt, the closest region to Uzbekistan, and all are on the
free tier. They were created through the Render API rather than by applying the
blueprint.

**Until the names match, do not apply the blueprint.** It no longer describes
the live resources, so Render would create a second set beside them rather than
adopt them.

### Migrating the Render resources to the new names

A Render Postgres instance cannot be renamed, and `databaseName`/`user` are
fixed at creation, so the database has to be replaced and reseeded:

1. Rename `qalarun-web`, `qalarun-api` and `qalarun-redis` in the dashboard
   (Settings → Name). Confirm whether each `*.onrender.com` hostname follows the
   rename — if it does, the old links stop working.
2. Create a new free Postgres named `dontstop-db` with database and user
   `dontstop`, in Frankfurt.
3. Point `DATABASE_URL` on the API at it, then run `alembic upgrade head` and
   `scripts.import_exclusions` against it as described below. The import is
   ~17,000 polygons and takes a while.
4. Update `CORS_ORIGINS` and `VITE_API_URL` to the final hostnames, then delete
   the old database once the new one serves traffic.

### Seeding a Render database

A free instance has no shell, and pre-deploy commands need a paid plan, so
migrations and the OSM import are run from a local container against the
database's **external** connection string:

```bash
docker compose exec -e DATABASE_URL="<external-url>?ssl=require" api   alembic upgrade head
docker compose exec -e DATABASE_URL="<external-url>?ssl=require" api   python -m scripts.import_exclusions
```

`?ssl=require` is required: SQLAlchemy maps it to asyncpg's `sslmode`, and
Render refuses a plain connection. External access is closed by default, so add
the machine's address to the database's IP allow list first and **remove it
again afterwards**.

## Why a deployment is needed at all

The browser Geolocation API requires a secure context. A phone can therefore
only run a real GPS test over HTTPS — never over `http://<laptop-ip>:5173`.
TZ section 21.5 lists the two supported options: an HTTPS tunnel for a quick
test, or a real deployment.

## First deploy

1. Push this repository to GitHub.
2. In the Render dashboard: **New → Blueprint**, pick the repository.
   Render reads `render.yaml` and creates the `dontstop-web` static site.
3. Wait for the first build, then open the `*.onrender.com` address.

Every later push to `main` redeploys automatically (`autoDeployTrigger: commit`).

## GitHub Pages (automatic)

`.github/workflows/deploy-pages.yml` lints, tests and builds the frontend on
every push to `main`, then publishes it to GitHub Pages. Nothing has to be
clicked: `actions/configure-pages` enables Pages on the first run.

The site lives at `https://hylgidra-cmd.github.io/<repo>/` - today still
`/qala-run/`, because the GitHub repository has not been renamed yet. A project
site is served under `/<repo>/`, so the workflow reads the name from GitHub
itself (`VITE_BASE=/${{ github.event.repository.name }}/`) and keeps working
either side of a rename;
every other target keeps the default `/`.

## Quick alternative without deploying

```bash
cloudflared tunnel --url http://localhost:5173
```

This prints a temporary `https://*.trycloudflare.com` address that serves the
local dev server. The address is public while the tunnel runs, and it changes
on every restart. `vite.config.ts` allows that host for development only.

## Opening it on a phone

The running site shows a QR card with its own address. Scan it, then press the
locate button on the map. The QR is hidden when the page is served from
`localhost`, because a phone cannot resolve that.
