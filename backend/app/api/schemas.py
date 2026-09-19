"""Request and response models for the run API (TZ sections 19 and 21)."""
from pydantic import BaseModel, Field


class PointIn(BaseModel):
    """One browser fix.

    `speed` is accepted for auditing only. The server recomputes speed with the
    Kalman filter and never uses this value for a decision (TZ section 20.1).
    """

    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    ts: float = Field(description="Unix timestamp in seconds")
    accuracy: float | None = Field(default=None, ge=0)
    speed: float | None = None
    mocked: bool = False


class PointsIn(BaseModel):
    points: list[PointIn] = Field(min_length=1, max_length=500)


class RunStarted(BaseModel):
    run_id: str
    mode: str
    started_at: str


class PointsAccepted(BaseModel):
    run_id: str
    stored: int
    total: int


class ActivityOut(BaseModel):
    type: str
    confidence: float
    avg_speed_ms: float


class CapturedFrom(BaseModel):
    """Who lost ground to this run.

    Clan ground belongs to the clan, so in clan mode these two fields carry the
    clan's id and its name; in solo mode they carry the player's.
    """

    user_id: str
    username: str
    area_lost_m2: float


class RunResult(BaseModel):
    run_id: str
    status: str
    reason: str | None = None
    mode: str
    closing_gap_m: float | None = Field(
        default=None, description="Distance between the first and last fix"
    )
    raw_area_m2: float | None = None
    excluded_area_m2: float | None = None
    awarded_area_m2: float | None = None
    territory_id: str | None = None
    activity: ActivityOut | None = None
    captured_from: list[CapturedFrom] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class ClanBrief(BaseModel):
    """What a player sees about their own clan from anywhere in the app."""

    id: str
    name: str
    tag: str
    color_hex: str
    role: str
    member_count: int


class ClanMemberOut(BaseModel):
    """A clan roster line. Never carries a coordinate (TZ section 26)."""

    user_id: str
    player_id: str
    display_name: str
    role: str
    joined_at: str


class ClanOut(BaseModel):
    id: str
    name: str
    tag: str
    color_hex: str
    created_at: str
    member_count: int
    area_m2: float
    members: list[ClanMemberOut] = Field(default_factory=list)
    # Only ever filled in for a member of the clan.
    invite_code: str | None = None


class ClanCreate(BaseModel):
    name: str = Field(min_length=3, max_length=48)
    tag: str = Field(pattern=r"^[A-Za-z0-9]{2,5}$")
    color_hex: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")


class ClanJoin(BaseModel):
    invite_code: str = Field(pattern=r"^[A-Za-z0-9]{6}$")


class ClanStanding(BaseModel):
    id: str
    name: str
    tag: str
    color_hex: str
    member_count: int
    area_m2: float


class PlayerStats(BaseModel):
    runs_accepted: int
    solo_area_m2: float
    clan_area_m2: float


class MeOut(BaseModel):
    """The player's own profile. Their id is theirs to read out; nobody
    else's device key is ever exposed."""

    user_id: str
    player_id: str
    display_name: str
    color_hex: str = "#00ff88"
    joined_at: str
    stats: PlayerStats
    clan: ClanBrief | None = None


class DisplayNameIn(BaseModel):
    display_name: str | None = Field(default=None, min_length=2, max_length=24)
    color_hex: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
