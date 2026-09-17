# Deploying the QalaRun web demo

## What is deployed

`render.yaml` deploys **only the frontend** as a Render static site. The API,
PostGIS and Redis stay local for now. That is enough for the current demo:
the map, the geolocate control and the phone QR card need no backend.

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
