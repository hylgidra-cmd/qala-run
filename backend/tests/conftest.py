"""Shared API test fixtures.

Every test runs inside a transaction that is rolled back, so the demo data
stays clean. They need the compose database and skip without it.
"""
import uuid

import httpx
import pytest
from asyncpg.exceptions import PostgresConnectionError
from sqlalchemy.exc import InterfaceError, OperationalError
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from app.api.deps import get_connection
from app.config import get_settings
from app.db import get_redis
from app.main import app


@pytest.fixture
async def client():
    # Both caches hold clients bound to an event loop, and every test gets a
    # fresh loop, so they have to be rebuilt per test.
    get_redis.cache_clear()
    engine = create_async_engine(get_settings().database_url, poolclass=NullPool)

    try:
        connection = await engine.connect()
    except (OperationalError, InterfaceError, OSError, PostgresConnectionError) as exc:
        await engine.dispose()
        pytest.skip(f"database not reachable ({type(exc).__name__}); start it with docker compose")

    transaction = await connection.begin()

    async def override_connection():
        yield connection

    app.dependency_overrides[get_connection] = override_connection

    try:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as http_client:
            http_client.connection = connection  # type: ignore[attr-defined]
            yield http_client
    finally:
        app.dependency_overrides.clear()
        await transaction.rollback()
        await connection.close()
        await engine.dispose()
        await get_redis().aclose()
        get_redis.cache_clear()


@pytest.fixture
def connection(client):
    """The very connection the API is using, inside the same transaction."""
    return client.connection


@pytest.fixture
def headers() -> dict[str, str]:
    """A fresh device per test keeps users and rate-limit buckets separate."""
    return {"X-Demo-User": uuid.uuid4().hex}
