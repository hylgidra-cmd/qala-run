"""Authentication endpoints — username/Gmail + password and Google Account sign-in.

POST /api/v1/auth/register  — create account (requires @gmail.com), get JWT
POST /api/v1/auth/login     — verify username or Gmail + password, get JWT
POST /api/v1/auth/google    — sign in / register with Google Account, get JWT
GET  /api/v1/auth/me        — decode token, return current user info
"""
import asyncio
import re
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

import bcrypt
import httpx
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
# Mandatory Gmail format: must be a valid @gmail.com address
_GMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]+@gmail\.com$", re.IGNORECASE)
# Password: at least 6 characters
_MIN_PASSWORD_LEN = 6
_MAX_AVATAR_LEN = 150_000

TOKEN_EXPIRE_DAYS = 30


# ── helpers ──────────────────────────────────────────────────────────────────

def validate_gmail_address(value: str) -> str:
    cleaned = (value or "").strip().lower()
    if not _GMAIL_RE.match(cleaned):
        raise ValueError(
            "Faqat to'g'ri @gmail.com pochta manzilini kiriting (masalan: ali@gmail.com)"
        )
    return cleaned


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
    email: str
    password: str
    display_name: str = Field(default="", max_length=32)
    city: str = DEFAULT_CITY_ID
    color_hex: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    avatar_data: str | None = Field(default=None, max_length=_MAX_AVATAR_LEN)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        cleaned = (v or "").strip()
        if not _USERNAME_RE.match(cleaned):
            raise ValueError("Username 3-32 ta belgi: harf, raqam yoki _")
        return cleaned

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return validate_gmail_address(v)

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


class GoogleAuthIn(BaseModel):
    """Google sign-in. The ID token is the only proof of identity accepted:
    the email and the Google account id are read from the verified token and
    never from the request body."""

    id_token: str = Field(min_length=20, max_length=4096)
    display_name: str = Field(default="", max_length=32)
    city: str = DEFAULT_CITY_ID
    color_hex: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    avatar_data: str | None = Field(default=None, max_length=_MAX_AVATAR_LEN)

    @field_validator("city")
    @classmethod
    def validate_city(cls, v: str) -> str:
        cleaned = (v or DEFAULT_CITY_ID).strip().lower()
        return cleaned if cleaned in CITIES else DEFAULT_CITY_ID


class AuthOut(BaseModel):
    token: str
    user_id: str
    player_id: str
    display_name: str
    email: str | None = None
    color_hex: str
    city: str = DEFAULT_CITY_ID
    avatar_data: str | None = None


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthOut, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterIn,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> AuthOut:
    """Create a new account with mandatory @gmail.com address. Returns a JWT token."""
    await enforce_rate_limit(f"auth:register:{body.username.lower()}", limit=5, window_s=60)

    # Check username taken
    taken_user = await connection.scalar(
        text("SELECT id FROM demo_users WHERE lower(username) = lower(:u)"),
        {"u": body.username},
    )
    if taken_user is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Bu username band, boshqasini tanlang")

    # Check Gmail taken
    taken_email = await connection.scalar(
        text("SELECT id FROM demo_users WHERE lower(email) = lower(:em)"),
        {"em": body.email},
    )
    if taken_email is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Bu Gmail manzili allaqachon ro'yxatdan o'tgan",
        )

    display_name = body.display_name.strip() or body.username
    password_hash = await asyncio.to_thread(_hash_password, body.password)
    city = body.city
    color_hex = body.color_hex or "#00ff88"
    device_key = f"usr_{uuid.uuid4().hex}"

    row = await connection.execute(
        text(
            """
            INSERT INTO demo_users (
                device_key, display_name, username, email,
                password_hash, city, color_hex, avatar_data
            )
            VALUES (:dk, :dn, :un, :em, :ph, :city, :color, :avatar)
            RETURNING id, player_id, color_hex
            """
        ),
        {
            "dk": device_key,
            "dn": display_name,
            "un": body.username,
            "em": body.email,
            "ph": password_hash,
            "city": city,
            "color": color_hex,
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
        email=body.email,
        color_hex=created.color_hex or color_hex,
        city=city,
        avatar_data=body.avatar_data,
    )


@router.post("/login", response_model=AuthOut)
async def login(
    body: LoginIn,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> AuthOut:
    """Verify username or @gmail.com + password, return JWT."""
    identifier = body.username.strip()
    await enforce_rate_limit(f"auth:login:{identifier.lower()}", limit=10, window_s=60)

    row = (
        await connection.execute(
            text(
                """
                SELECT id, player_id, display_name, email,
                       color_hex, city, avatar_data, password_hash
                  FROM demo_users
                 WHERE lower(username) = lower(:u)
                    OR lower(email) = lower(:u)
                 LIMIT 1
                """
            ),
            {"u": identifier},
        )
    ).one_or_none()

    if row is None or row.password_hash is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Username/Gmail yoki parol noto'g'ri",
        )

    valid_pw = await asyncio.to_thread(_verify_password, body.password, row.password_hash)
    if not valid_pw:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Username/Gmail yoki parol noto'g'ri",
        )

    user_id = str(row.id)
    token = _make_token(user_id)

    return AuthOut(
        token=token,
        user_id=user_id,
        player_id=str(row.player_id),
        display_name=row.display_name,
        email=getattr(row, "email", None),
        color_hex=row.color_hex or "#00ff88",
        city=getattr(row, "city", DEFAULT_CITY_ID) or DEFAULT_CITY_ID,
        avatar_data=getattr(row, "avatar_data", None),
    )


_GOOGLE_ISSUERS = frozenset({"accounts.google.com", "https://accounts.google.com"})


async def _verify_google_id_token(id_token: str) -> dict[str, str]:
    """Verify a Google ID token and return the identity it proves.

    Google's tokeninfo endpoint checks the signature and the expiry. That
    alone is not enough: a token issued to *any* app would pass, so the
    audience must be one of our own OAuth client ids, and the email must be
    one Google has verified.
    """
    client_ids = get_settings().google_client_id_list
    if not client_ids:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Google orqali kirish sozlanmagan",
        )

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token},
            )
    except httpx.HTTPError as err:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            "Google serveri bilan bog'lanib bo'lmadi",
        ) from err

    if resp.status_code != 200:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Google tokeni yaroqsiz yoki muddati o'tgan",
        )
    return _google_identity(resp.json(), client_ids)


def _google_identity(data: dict, client_ids: list[str]) -> dict[str, str]:
    """Check the claims of an already signature-verified token."""
    invalid = HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        "Google tokeni yaroqsiz yoki muddati o'tgan",
    )
    if str(data.get("aud", "")) not in client_ids:
        raise invalid
    if str(data.get("iss", "")) not in _GOOGLE_ISSUERS:
        raise invalid
    if str(data.get("email_verified", "")).lower() != "true":
        raise invalid

    sub = str(data.get("sub", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    if not sub or not email:
        raise invalid
    return {"email": email, "sub": sub, "name": str(data.get("name", "")).strip()}


def _sanitize_username_from_email(email: str) -> str:
    local = email.split("@")[0]
    cleaned = re.sub(r"[^A-Za-z0-9_]", "_", local)
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    if len(cleaned) < 3:
        cleaned = f"usr_{cleaned or 'player'}"
    return cleaned[:24]


@router.post("/google", response_model=AuthOut)
async def google_auth(
    body: GoogleAuthIn,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> AuthOut:
    """Sign in or register with a Google Account (@gmail.com)."""

    verified = await _verify_google_id_token(body.id_token)
    email = verified["email"]
    google_sub = verified["sub"]
    google_name = body.display_name.strip() or verified["name"][:24]

    try:
        email = validate_gmail_address(email)
    except ValueError as err:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(err)) from err

    await enforce_rate_limit(f"auth:google:{email}", limit=10, window_s=60)

    # 1. Check if account already exists by google_sub or email
    existing = (
        await connection.execute(
            text(
                """
                SELECT id, player_id, display_name, email, color_hex, city, avatar_data,
                       google_sub
                  FROM demo_users
                 WHERE google_sub = :gsub
                    OR (google_sub IS NULL AND lower(email) = lower(:em))
                 ORDER BY (google_sub = :gsub) DESC NULLS LAST
                 LIMIT 1
                """
            ),
            {"em": email, "gsub": google_sub},
        )
    ).one_or_none()

    if existing is not None:
        user_id = str(existing.id)
        if existing.google_sub is None:
            # First Google sign-in on an account that was registered with this
            # address and a password. Nobody proved they owned the address at
            # registration, so whoever set that password may not be its owner:
            # the password stops working and Google becomes the way in.
            await connection.execute(
                text(
                    """
                    UPDATE demo_users
                       SET google_sub = :gsub,
                           password_hash = NULL
                     WHERE id = :uid
                    """
                ),
                {"gsub": google_sub, "uid": user_id},
            )
        return AuthOut(
            token=_make_token(user_id),
            user_id=user_id,
            player_id=str(existing.player_id),
            display_name=existing.display_name,
            email=existing.email or email,
            color_hex=existing.color_hex or "#00ff88",
            city=getattr(existing, "city", DEFAULT_CITY_ID) or DEFAULT_CITY_ID,
            avatar_data=getattr(existing, "avatar_data", None),
        )

    # 2. Create a new Google-backed account
    base_username = _sanitize_username_from_email(email)
    candidate_username = base_username
    for _ in range(5):
        taken = await connection.scalar(
            text("SELECT id FROM demo_users WHERE lower(username) = lower(:u)"),
            {"u": candidate_username},
        )
        if taken is None:
            break
        candidate_username = f"{base_username[:20]}_{uuid.uuid4().hex[:4]}"

    display_name = google_name or base_username
    color_hex = body.color_hex or "#00ff88"
    device_key = f"ggl_{uuid.uuid4().hex}"

    created = (
        await connection.execute(
            text(
                """
                INSERT INTO demo_users (
                    device_key, display_name, username, email,
                    google_sub, city, color_hex, avatar_data
                )
                VALUES (:dk, :dn, :un, :em, :gsub, :city, :color, :avatar)
                RETURNING id, player_id, color_hex
                """
            ),
            {
                "dk": device_key,
                "dn": display_name,
                "un": candidate_username,
                "em": email,
                "gsub": google_sub,
                "city": body.city,
                "color": color_hex,
                "avatar": body.avatar_data,
            },
        )
    ).one()

    user_id = str(created.id)
    return AuthOut(
        token=_make_token(user_id),
        user_id=user_id,
        player_id=str(created.player_id),
        display_name=display_name,
        email=email,
        color_hex=created.color_hex or color_hex,
        city=body.city,
        avatar_data=body.avatar_data,
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
                SELECT id, player_id, display_name, email, color_hex, city, avatar_data
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
        email=getattr(row, "email", None),
        color_hex=row.color_hex or "#00ff88",
        city=getattr(row, "city", DEFAULT_CITY_ID) or DEFAULT_CITY_ID,
        avatar_data=getattr(row, "avatar_data", None),
    )


