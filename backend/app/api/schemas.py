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
    user_id: str
    username: str
    area_lost_m2: float


class RunResult(BaseModel):
    run_id: str
    status: str
    reason: str | None = None
    mode: str
    raw_area_m2: float | None = None
    excluded_area_m2: float | None = None
    awarded_area_m2: float | None = None
    territory_id: str | None = None
    activity: ActivityOut | None = None
    captured_from: list[CapturedFrom] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
