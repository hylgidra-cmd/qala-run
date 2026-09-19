# Don't Stop project decisions

## Branding

- Product name: **Don't Stop**
- Logo mark: **DS**
- Repository slug: `dont-stop`
- Service and identifier prefix: `dontstop` (no hyphen, no apostrophe)
- Working tagline: **Run. Capture. Defend.**
- Previous working names: QalaRun (until 2026-09-19), Qaraqalpaq Run

Renamed to **Don't Stop** on 2026-09-19. `docs/TZ-noutbuk-dev-setup-v2.1.md`
deliberately keeps its original "Qaraqalpaq Run" wording: it is the signed
specification and was not rewritten at the QalaRun rename either, so this file
remains the single source of truth for the current name.

The name should receive a final domain, app-store, and trademark check before public launch.

## MVP

- Web demo first; Android APK is a later phase.
- Pilot area: Nukus center, bbox `59.58,42.43,59.64,42.48`.
- Solo, clan, and coarse-presence chat are inside the web-demo MVP.
- Browser GPS requires the screen and run page to remain active.
- ML is not part of MVP. Kalman filtering and rule-based activity detection are allowed.

## Maps

- DEV: MapLibre + OpenFreeMap Positron.
- Production: raw self-hosted PMTiles via Nginx and pmtiles.js.
- Server geometry: OSM-derived PostGIS data, separate from visual basemap tiles.

## Safety and privacy

- Public presence is coarse, never exact.
- Live sharing defaults to off.
- Server recalculates run metrics.
- Private-property coverage is limited by available OSM geometry and is never presented as 100% complete.
