from contextlib import asynccontextmanager

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import runs, territories
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


app.include_router(runs.router)
app.include_router(territories.router)


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
