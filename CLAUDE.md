# Don't Stop instructions for Claude Code

## Product

Don't Stop is a Nukus web-demo game where walking/running around a valid closed route can capture territory. The final technical specification is `docs/TZ-noutbuk-dev-setup-v2.1.md` when present.

## Stack

- Frontend: React, TypeScript, Vite, MapLibre GL, react-map-gl
- Backend: FastAPI, Pydantic Settings, SQLAlchemy 2 async, Alembic
- Data: PostgreSQL 16 + PostGIS, Redis 7
- Geo: Shapely 2, pyproj; server is authoritative
- Tests: Pytest and Vitest

## Non-negotiable rules

1. Read the relevant TZ section and existing code before changing files.
2. Work on one bounded prompt at a time. Do not implement future weeks early.
3. Do not silently change product rules, thresholds, bbox, API paths, or privacy behavior.
4. Never hard-code secrets. Never print `.env` or tokens.
5. Never trust client-computed speed, distance, area, activity, status, or ownership.
6. Public presence must never expose exact coordinates.
7. Mock GPS and DEV panel must not be enabled in production.
8. Keep solo and clan territory modes separate.
9. Add or update tests with every behavior change.
10. Run the narrow tests first, then full checks. Report exact commands and results.
11. Preserve user changes and do not use destructive Git commands.
12. If the TZ and code conflict, stop and explain the conflict before guessing.

## Current milestone

Sprint 1 foundation only:

- Docker/PostGIS/Redis;
- FastAPI config, DB, health, first migration;
- React/Vite shell;
- OpenFreeMap Positron map inside the pilot bbox;
- baseline tests and documentation.

Clan, chat, run geometry, Kalman, OSM import, auth, PMTiles, and mobile are later prompts unless the user explicitly selects them.

## Required completion format

At the end of each task provide:

1. Files changed.
2. What now works.
3. Commands/tests run and their result.
4. Remaining risks or blockers.
5. The smallest safe next step.
