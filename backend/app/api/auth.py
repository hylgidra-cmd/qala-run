"""Authentication endpoints — username + password.

POST /api/v1/auth/register  — create account, get JWT
POST /api/v1/auth/login     — verify credentials, get JWT
GET  /api/v1/auth/me        — decode token, return current user info
"""
import re
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.deps import get_connection
from app.config import get_settings

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# Username: 3-32 chars, only letters / digits / underscore
_USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,32}$")
# Password: at least 6 characters
_MIN_PASSWORD_LEN = 6

TOKEN_EXPIRE_DAYS = 30


# ── helpers ──────────────────────────────────────────────────────────────────

def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _make_token(user_id: str) -> str:
    settings = get_settings()
    payload = {
        "sub": user_id,
        "exp": datetime.now(UTC) + timedelta(days=TOKEN_EXPIRE_DAYS),
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> str:
    """Returns user_id (sub) or raises HTTPException 401."""
    settings = get_settings()
    try:
        data = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return str(data["sub"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token muddati o'tgan")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Noto'g'ri token")


def _next_player_id(existing: set[int]) -> int:
    """8-digit ID, never starts with 0."""
    import random
    for _ in range(1000):
        pid = random.randint(10_000_000, 99_999_999)
        if pid not in existing:
            return pid
    raise RuntimeError("player_id pool exhausted")


# ── schemas ───────────────────────────────────────────────────────────────────

class RegisterIn(BaseModel):
    username: str
    password: str
    display_name: str = ""

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not _USERNAME_RE.match(v):
            raise ValueError("Username 3-32 ta belgi: harf, raqam yoki _")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < _MIN_PASSWORD_LEN:
            raise ValueError(f"Parol kamida {_MIN_PASSWORD_LEN} ta belgi bo'lishi kerak")
        return v


class LoginIn(BaseModel):
    username: str
    password: str


class AuthOut(BaseModel):
    token: str
    user_id: str
    player_id: str
    display_name: str
    color_hex: str


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthOut, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterIn,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> AuthOut:
    """Create a new account. Returns a JWT token on success."""
    # Check username taken
    taken = await connection.scalar(
        text("SELECT id FROM demo_users WHERE lower(username) = lower(:u)"),
        {"u": body.username},
    )
    if taken is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Bu username band, boshqasini tanlang")

    # Generate unique 8-digit player_id
    existing_ids = {
        row[0]
        for row in (await connection.execute(text("SELECT player_id FROM demo_users"))).all()
    }
    player_id = _next_player_id(existing_ids)

    display_name = body.display_name.strip() or body.username
    password_hash = _hash_password(body.password)
    # Use a deterministic device_key so we don't leave a null
    device_key = f"usr_{uuid.uuid4().hex}"

    row = await connection.execute(
        text(
            """
            INSERT INTO demo_users
                (device_key, player_id, display_name, username, password_hash)
            VALUES (:dk, :pid, :dn, :un, :ph)
            RETURNING id, color_hex
            """
        ),
        {
            "dk": device_key,
            "pid": player_id,
            "dn": display_name,
            "un": body.username,
            "ph": password_hash,
        },
    )
    created = row.one()
    user_id = str(created.id)
    token = _make_token(user_id)

    return AuthOut(
        token=token,
        user_id=user_id,
        player_id=str(player_id),
        display_name=display_name,
        color_hex=created.color_hex or "#00ff88",
    )


@router.post("/login", response_model=AuthOut)
async def login(
    body: LoginIn,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> AuthOut:
    """Verify username+password, return JWT."""
    row = (
        await connection.execute(
            text(
                """
                SELECT id, player_id, display_name, color_hex, password_hash
                  FROM demo_users
                 WHERE lower(username) = lower(:u)
                """
            ),
            {"u": body.username},
        )
    ).one_or_none()

    if row is None or row.password_hash is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Username yoki parol noto'g'ri")

    if not _verify_password(body.password, row.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Username yoki parol noto'g'ri")

    user_id = str(row.id)
    token = _make_token(user_id)

    return AuthOut(
        token=token,
        user_id=user_id,
        player_id=str(row.player_id),
        display_name=row.display_name,
        color_hex=row.color_hex or "#00ff88",
    )
