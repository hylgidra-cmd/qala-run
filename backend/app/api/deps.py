"""Shared API dependencies.

DEMO ONLY: `X-Demo-User` stands in for authentication, which is a separate
prompt. It identifies a browser, not a person, and must be replaced before
anything reaches production.
"""
import logging
import re
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.db import get_engine, get_redis

logger = logging.getLogger(__name__)

DEVICE_KEY_PATTERN = re.compile(r"^[A-Za-z0-9_-]{8,64}$")


async def get_connection():
    async with get_engine().begin() as connection:
        yield connection


async def get_demo_user(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    x_demo_user: Annotated[str | None, Header()] = None,
) -> str:
    if not x_demo_user or not DEVICE_KEY_PATTERN.match(x_demo_user):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Demo-User header is missing or malformed",
        )

    user_id = await connection.scalar(
        text(
            """
            INSERT INTO demo_users (device_key, display_name)
            VALUES (:device_key, :display_name)
            ON CONFLICT (device_key) DO UPDATE SET device_key = EXCLUDED.device_key
            RETURNING id
            """
        ),
        {"device_key": x_demo_user, "display_name": f"Runner {x_demo_user[:6]}"},
    )

    return str(user_id)


async def enforce_rate_limit(key: str, limit: int, window_s: int) -> None:
    """Fixed-window limiter (TZ section 25).

    Redis being unavailable must not take the API down, so a failure here is
    logged by the caller and the request proceeds.
    """
    bucket = f"ratelimit:{key}"

    try:
        redis = get_redis()
        used = await redis.incr(bucket)
        if used == 1:
            await redis.expire(bucket, window_s)
    except Exception:  # noqa: BLE001 - a broken limiter must not break the API
        logger.warning("rate limiter unavailable, allowing %s", key, exc_info=True)
        return

    if used > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
        )
