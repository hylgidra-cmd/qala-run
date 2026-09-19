from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Don't Stop API"
    app_version: str = "0.1.0"
    environment: str = Field(default="development", alias="ENV")
    database_url: str = "postgresql+asyncpg://dontstop:change_me@localhost:5432/dontstop"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "development-only-change-me"
    cors_origins: str = "http://localhost:5173"

    # --- Pilot region (docs/PROJECT_DECISIONS.md) ---
    pilot_west: float = 59.58
    pilot_south: float = 42.43
    pilot_east: float = 59.64
    pilot_north: float = 42.48

    # --- Run acceptance thresholds ---
    # Product decision (2026-09-17), overriding TZ section 19, which specified
    # MIN_LOOP_PERIMETER = 300 m and MIN_AREA = 2,000 m2: any shape a person
    # actually walks counts. Three corners, a curve or a small yard all award
    # the ground they enclose, so the floor is 1 and there is no ceiling.
    # Raising these env vars restores TOO_SHORT and AREA_TOO_SMALL unchanged.
    min_loop_perimeter_m: float = 1.0
    min_area_m2: float = 1.0

    # Product decision (2026-09-17): the runner decides when the loop is done.
    # None means the server sets no minimum or maximum on the closing gap and
    # simply joins the last fix back to the first. Setting a number here
    # re-enables the LOOP_NOT_CLOSED rejection without any code change.
    loop_close_tolerance_m: float | None = None

    # Above this gap the result reports that the server closed the ring, so a
    # large jump stays visible in the response and in the audit trail.
    loop_close_warning_m: float = 30.0

    # --- Anti-cheat thresholds (TZ section 25) ---
    max_accuracy_m: float = 35.0
    max_run_speed_ms: float = 7.5
    teleport_speed_ms: float = 15.0
    min_point_density_per_s: float = 0.5
    min_points: int = 8

    @field_validator("database_url")
    @classmethod
    def use_the_async_driver(cls, value: str) -> str:
        """Managed hosts hand out a plain `postgres://` URL; we need asyncpg."""
        for prefix in ("postgresql+asyncpg://", "postgresql+psycopg://"):
            if value.startswith(prefix):
                return value

        for prefix in ("postgresql://", "postgres://"):
            if value.startswith(prefix):
                return "postgresql+asyncpg://" + value[len(prefix) :]

        return value

    @property
    def pilot_bbox(self) -> tuple[float, float, float, float]:
        return (self.pilot_west, self.pilot_south, self.pilot_east, self.pilot_north)

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
