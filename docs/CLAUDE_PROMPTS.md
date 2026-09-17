# Claude Code prompt sequence

Use one prompt at a time. Do not paste all prompts into one session.

## Prompt 0 — inspect only

```text
You are working on the QalaRun project.

First read CLAUDE.md, README.md, docs/PROJECT_DECISIONS.md and docs/TZ-noutbuk-dev-setup-v2.1.md if it exists. Then inspect the repository and Git status.

Do not change any files yet. Report:
1. current architecture and what already works;
2. missing Sprint 1 items;
3. contradictions between code and the TZ;
4. exact commands you recommend running next;
5. a small implementation plan with verification after each step.

Never reveal secrets or print .env contents.
```

## Prompt 1 — verify foundation

```text
Continue QalaRun Sprint 1 only.

Verify the existing Docker Compose, FastAPI health endpoints, React/Vite shell and MapLibre map. Fix only issues that prevent the foundation from installing, starting, linting, testing or building.

Requirements:
- preserve the pilot bbox and Positron style;
- keep frontend outside Docker;
- do not implement auth, clan, chat, run geometry, Kalman or OSM import yet;
- do not hard-code secrets;
- add tests for every fix;
- run the relevant backend tests and frontend lint/test/build.

At the end use the completion format from CLAUDE.md.
```

## Prompt 2 — database and first migration

```text
Implement only the QalaRun database foundation.

Add Alembic and an initial migration that enables PostGIS and creates the minimal region_boundaries and exclusion_zones tables from the TZ, including SRID 4326, uniqueness constraints and GiST indexes.

Requirements:
- migration upgrade and downgrade must work on a fresh database;
- no user, clan, run, territory or chat tables yet;
- add a database integration test where practical;
- verify with docker compose and show exact commands/results.
```

## Prompt 3 — boundary and exclusion read APIs

```text
Implement only read-only GeoJSON APIs for QalaRun:
- GET /api/v1/regions
- GET /api/v1/zones/exclusions?bbox=west,south,east,north

Follow the TZ rules for bbox order, validation, maximum size, SRID and GeoJSON FeatureCollection output. Use parameterized SQL/SQLAlchemy and make GiST indexes usable. Add tests for valid, invalid and oversized bbox requests.

Do not implement OSM import or frontend layers in this prompt.
```

## Prompt 4 — frontend layers

```text
Implement the QalaRun BoundaryLayer and ExclusionLayer using the existing MapLibre map and the read APIs.

Requirements:
- request the initial bbox on map load;
- request later bbox values on move end with 300 ms debounce;
- round bbox values for stable caching;
- use stable source/layer IDs and do not recreate layers unnecessarily;
- include loading, empty and error states;
- add frontend tests and run lint/test/build.
```

## Prompt 5 — stop and review

```text
Review the completed QalaRun Sprint 1 without changing files.

Compare implementation against CLAUDE.md and the Sprint 1 acceptance criteria in the TZ. Produce a pass/fail table, list security/privacy issues, and propose only the next smallest Sprint 2 task. Do not begin Sprint 2.
```
