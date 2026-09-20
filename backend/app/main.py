from contextlib import asynccontextmanager

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy import text

from app.api import admin, clans, notifications, players, runs, territories, zones
from app.config import get_settings
from app.db import get_engine, get_redis

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    await get_engine().dispose()
    await get_redis().aclose()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

# The map layers are the only large responses, and they compress about ten to
# one. Small ones are left alone so a health check stays cheap.
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    # X-Demo-User is a custom header, so it must be allowed or the browser
    # preflight fails when the frontend and API are on different origins.
    allow_headers=["Authorization", "Content-Type", "X-Demo-User"],
)


app.include_router(runs.router)
app.include_router(territories.router)
app.include_router(zones.router)
app.include_router(players.router)
app.include_router(clans.router)
app.include_router(admin.router)
app.include_router(notifications.router)


@app.get("/", tags=["meta"])
async def index() -> dict[str, object]:
    """The API has no home page; say where things are instead of a bare 404."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
        "endpoints": [
            "POST /api/v1/runs/start",
            "POST /api/v1/runs/{run_id}/points",
            "POST /api/v1/runs/{run_id}/finish",
            "POST /api/v1/runs/{run_id}/abandon",
            "GET /api/v1/territories?bbox=west,south,east,north&mode=solo",
            "GET /api/v1/zones/exclusions?bbox=west,south,east,north",
            "GET /api/v1/me",
            "POST /api/v1/clans",
            "POST /api/v1/clans/join",
            "GET /api/v1/clans/leaderboard",
        ],
    }


@app.get("/api/v1", tags=["meta"])
async def api_index() -> dict[str, object]:
    """`/api/v1` is a prefix, not an endpoint. Say so instead of a bare 404."""
    return await index()


@app.get("/health/live", tags=["health"])
async def liveness() -> dict[str, str]:
    return {"status": "ok", "version": settings.app_version}


@app.get("/health", tags=["health"])
async def dependency_health(response: Response) -> dict[str, str]:
    checks = {"database": "error", "redis": "error", "postgis": "error"}

    try:
        async with get_engine().connect() as connection:
            checks["database"] = "ok" if await connection.scalar(text("SELECT 1")) == 1 else "error"
            postgis_version = await connection.scalar(text("SELECT PostGIS_Version()"))
            checks["postgis"] = "ok" if postgis_version else "error"
    except Exception:
        pass

    try:
        checks["redis"] = "ok" if await get_redis().ping() else "error"
    except Exception:
        pass

    healthy = all(value == "ok" for value in checks.values())
    if not healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ok" if healthy else "degraded",
        **checks,
        "version": settings.app_version,
    }
