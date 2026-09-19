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

## Language

The site speaks **Karakalpak** (Latin script) and nothing else: no language
switch, no English fallback. The pilot is played in Nukus, so Karakalpak is the
product's own language rather than a translation layer.

Every string lives in `frontend/src/i18n/qq.ts`, which is what makes the
wording reviewable by a speaker without reading the components. Server
messages stay in English because they are a developer-facing contract; the UI
maps status codes and enums (`reasons`, `activity`, clan roles) to Karakalpak,
and a test fails if the server grows an enum value the language file does not
cover.

## Player identity

Every browser is given a random **8-digit player id** on first contact, the way
PUBG and Free Fire do, plus a default name of `Oyınshı <id>` that the player
can change. Both are database defaults (migration 0003), so any row created by
any route gets them. The id is public and readable out loud; the device key
behind it never leaves the server.

This does not replace authentication - `X-Demo-User` is still a demo stand-in.

## Clans

- One clan per player, ten members, enforced by a database trigger.
- Clan ground belongs to the **clan**, not to the member who walked it, so it
  stays when someone leaves.
- Solo and clan are two maps over the same city. A run belongs to one mode,
  chosen before it starts, and can neither take nor lose ground in the other.
- `POST /api/v1/clans/join` (code only, no clan id) is an addition to TZ
  section 23.3, which specifies `POST /api/v1/clans/{id}/join`. Both exist and
  do the same thing: a lobby-style code box is what players expect, and the TZ
  path still works.

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
