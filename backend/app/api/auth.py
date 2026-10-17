"""Authentication endpoints — username + password.

POST /api/v1/auth/register  — create account, get JWT
POST /api/v1/auth/login     — verify credentials, get JWT
GET  /api/v1/auth/me        — decode token, return current user info
"""
import asyncio
import re
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.deps import enforce_rate_limit, get_connection, get_demo_user
from app.config import get_settings
from app.geo.cities import CITIES, DEFAULT_CITY_ID

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# Username: 3-32 chars, only letters / digits / underscore
_USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,32}$")
# Password: at least 6 characters
_MIN_PASSWORD_LEN = 6
_MAX_AVATAR_LEN = 150_000

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
    except jwt.ExpiredSignatureError as err:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token muddati o'tgan") from err
    except jwt.PyJWTError as err:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Noto'g'ri token") from err


# ── schemas ───────────────────────────────────────────────────────────────────

class RegisterIn(BaseModel):
    username: str
    password: str
    display_name: str = Field(default="", max_length=32)
    city: str = DEFAULT_CITY_ID
    avatar_data: str | None = Field(default=None, max_length=_MAX_AVATAR_LEN)

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

    @field_validator("city")
    @classmethod
    def validate_city(cls, v: str) -> str:
        cleaned = (v or DEFAULT_CITY_ID).strip().lower()
        return cleaned if cleaned in CITIES else DEFAULT_CITY_ID


class LoginIn(BaseModel):
    username: str
    password: str


class AuthOut(BaseModel):
    token: str
    user_id: str
    player_id: str
    display_name: str
    color_hex: str
    city: str = DEFAULT_CITY_ID
    avatar_data: str | None = None


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthOut, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterIn,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> AuthOut:
    """Create a new account. Returns a JWT token on success."""
    await enforce_rate_limit(f"auth:register:{body.username.lower()}", limit=5, window_s=60)

    # Check username taken
    taken = await connection.scalar(
        text("SELECT id FROM demo_users WHERE lower(username) = lower(:u)"),
        {"u": body.username},
    )
    if taken is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Bu username band, boshqasini tanlang")

    display_name = body.display_name.strip() or body.username
    password_hash = await asyncio.to_thread(_hash_password, body.password)
    city = body.city
    # Use a deterministic device_key so we don't leave a null
    device_key = f"usr_{uuid.uuid4().hex}"

    row = await connection.execute(
        text(
            """
            INSERT INTO demo_users
                (device_key, display_name, username, password_hash, city, avatar_data)
            VALUES (:dk, :dn, :un, :ph, :city, :avatar)
            RETURNING id, player_id, color_hex
            """
        ),
        {
            "dk": device_key,
            "dn": display_name,
            "un": body.username,
            "ph": password_hash,
            "city": city,
            "avatar": body.avatar_data,
        },
    )
    created = row.one()
    user_id = str(created.id)
    token = _make_token(user_id)

    return AuthOut(
        token=token,
        user_id=user_id,
        player_id=str(created.player_id),
        display_name=display_name,
        color_hex=created.color_hex or "#00ff88",
        city=city,
        avatar_data=body.avatar_data,
    )


@router.post("/login", response_model=AuthOut)
async def login(
    body: LoginIn,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> AuthOut:
    """Verify username+password, return JWT."""
    await enforce_rate_limit(f"auth:login:{body.username.lower()}", limit=10, window_s=60)

    row = (
        await connection.execute(
            text(
                """
                SELECT id, player_id, display_name, color_hex, city, avatar_data, password_hash
                  FROM demo_users
                 WHERE lower(username) = lower(:u)
                """
            ),
            {"u": body.username},
        )
    ).one_or_none()

    if row is None or row.password_hash is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Username yoki parol noto'g'ri")

    valid_pw = await asyncio.to_thread(_verify_password, body.password, row.password_hash)
    if not valid_pw:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Username yoki parol noto'g'ri")

    user_id = str(row.id)
    token = _make_token(user_id)

    return AuthOut(
        token=token,
        user_id=user_id,
        player_id=str(row.player_id),
        display_name=row.display_name,
        color_hex=row.color_hex or "#00ff88",
        city=getattr(row, "city", DEFAULT_CITY_ID) or DEFAULT_CITY_ID,
        avatar_data=getattr(row, "avatar_data", None),
    )


@router.get("/me", response_model=AuthOut)
async def auth_me(
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> AuthOut:
    """Decode token and return current user info."""
    row = (
        await connection.execute(
            text(
                """
                SELECT id, player_id, display_name, color_hex, city, avatar_data
                  FROM demo_users
                 WHERE id = :uid
                """
            ),
            {"uid": user_id},
        )
    ).one_or_none()

    if row is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Foydalanuvchi topilmadi")

    return AuthOut(
        token=_make_token(str(row.id)),
        user_id=str(row.id),
        player_id=str(row.player_id),
        display_name=row.display_name,
        color_hex=row.color_hex or "#00ff88",
        city=getattr(row, "city", DEFAULT_CITY_ID) or DEFAULT_CITY_ID,
        avatar_data=getattr(row, "avatar_data", None),
    )

