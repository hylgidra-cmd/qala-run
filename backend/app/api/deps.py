"""Shared API dependencies.

Supports two auth modes (both accepted simultaneously):
  1. Bearer <jwt>  — new username+password accounts (auth.py)
  2. X-Demo-User   — legacy device-key flow (QR scan, backward compat)
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
    authorization: Annotated[str | None, Header()] = None,
    x_demo_user: Annotated[str | None, Header()] = None,
) -> str:
    # ── 1. JWT Bearer token (new auth) ───────────────────────────────────────
    if authorization and authorization.startswith("Bearer "):
        from app.api.auth import decode_token  # local import avoids circular

        token = authorization[len("Bearer "):]
        user_id = decode_token(token)  # raises 401 if invalid

        # Touch last_seen_at so the admin view stays fresh
        await connection.execute(
            text("UPDATE demo_users SET last_seen_at = now() WHERE id = :uid"),
            {"uid": user_id},
        )
        return user_id

    # ── 2. X-Demo-User device key (legacy QR / backward compat) ──────────────
    if x_demo_user and DEVICE_KEY_PATTERN.match(x_demo_user):
        user_id = await connection.scalar(
            text(
                """
                INSERT INTO demo_users (device_key, last_seen_at)
                VALUES (:device_key, now())
                ON CONFLICT (device_key) DO UPDATE SET last_seen_at = now()
                RETURNING id
                """
            ),
            {"device_key": x_demo_user},
        )
        return str(user_id)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authorization (Bearer token) yoki X-Demo-User header kerak",
    )



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
