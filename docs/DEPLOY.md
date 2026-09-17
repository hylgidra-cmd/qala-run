# Deploying the QalaRun web demo

## What is deployed

There are two deployment targets, and they are not equivalent.

**Render (`render.yaml`) deploys the whole stack**: a PostGIS database, a Redis
key-value store, the FastAPI backend as a Docker service and the frontend as a
static site. `preDeployCommand` runs `alembic upgrade head` before each deploy.
The static site is built with an absolute `VITE_API_URL`, and the API allows
that origin through `CORS_ORIGINS`.

**GitHub Pages deploys the frontend only.** It has no backend, so the run panel
says plainly that no API is reachable and the page is map-only.

After the first Render deploy, load the exclusion zones once:

```bash
render exec qalarun-api -- python -m scripts.import_exclusions
```

## Why a deployment is needed at all

The browser Geolocation API requires a secure context. A phone can therefore
only run a real GPS test over HTTPS — never over `http://<laptop-ip>:5173`.
TZ section 21.5 lists the two supported options: an HTTPS tunnel for a quick
test, or a real deployment.

## First deploy

1. Push this repository to GitHub.
2. In the Render dashboard: **New → Blueprint**, pick the repository.
   Render reads `render.yaml` and creates the `qalarun-web` static site.
3. Wait for the first build, then open the `*.onrender.com` address.

Every later push to `main` redeploys automatically (`autoDeployTrigger: commit`).

## GitHub Pages (automatic)

`.github/workflows/deploy-pages.yml` lints, tests and builds the frontend on
every push to `main`, then publishes it to GitHub Pages. Nothing has to be
clicked: `actions/configure-pages` enables Pages on the first run.

The site lives at `https://hylgidra-cmd.github.io/qala-run/`. A project site is
served under `/<repo>/`, so the workflow builds with `VITE_BASE=/qala-run/`;
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
