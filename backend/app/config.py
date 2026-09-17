from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "QalaRun API"
    app_version: str = "0.1.0"
    environment: str = Field(default="development", alias="ENV")
    database_url: str = "postgresql+asyncpg://qrun:change_me@localhost:5432/qrun"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "development-only-change-me"
    cors_origins: str = "http://localhost:5173"

    # --- Pilot region (docs/PROJECT_DECISIONS.md) ---
    pilot_west: float = 59.58
    pilot_south: float = 42.43
    pilot_east: float = 59.64
    pilot_north: float = 42.48

    # --- Run acceptance thresholds (TZ section 19) ---
    min_loop_perimeter_m: float = 300.0
    min_area_m2: float = 2000.0

    # NOT specified in TZ-noutbuk-dev-setup-v2.1: how near the finish has to be
    # to the start before the track counts as a closed loop. Exposed as a
    # setting so the product owner can fix the value without a code change.
    loop_close_tolerance_m: float = 30.0

    # --- Anti-cheat thresholds (TZ section 25) ---
    max_accuracy_m: float = 35.0
    max_run_speed_ms: float = 7.5
    teleport_speed_ms: float = 15.0
    min_point_density_per_s: float = 0.5
    min_points: int = 8

    @property
    def pilot_bbox(self) -> tuple[float, float, float, float]:
        return (self.pilot_west, self.pilot_south, self.pilot_east, self.pilot_north)

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
