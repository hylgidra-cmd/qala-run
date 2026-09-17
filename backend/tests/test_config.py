"""Settings normalisation."""
import pytest

from app.config import Settings


def make(url: str) -> Settings:
    return Settings(_env_file=None, database_url=url)


class TestDatabaseUrl:
    @pytest.mark.parametrize(
        "url",
        [
            "postgres://user:pw@host:5432/qrun",
            "postgresql://user:pw@host:5432/qrun",
        ],
    )
    def test_a_managed_host_url_gets_the_async_driver(self, url: str) -> None:
        """Render and friends hand out a plain URL; SQLAlchemy needs asyncpg."""
        assert make(url).database_url.startswith("postgresql+asyncpg://")

    def test_the_rest_of_the_url_is_untouched(self) -> None:
        assert make("postgres://user:pw@host:5432/qrun").database_url.endswith(
            "user:pw@host:5432/qrun"
        )

    def test_an_explicit_driver_is_left_alone(self) -> None:
        url = "postgresql+asyncpg://user:pw@host:5432/qrun"

        assert make(url).database_url == url


class TestPilotBbox:
    def test_bbox_is_west_south_east_north(self) -> None:
        assert Settings(_env_file=None).pilot_bbox == (59.58, 42.43, 59.64, 42.48)


class TestLoopClosure:
    def test_the_runner_decides_by_default(self) -> None:
        """Product decision: no server minimum or maximum on the closing gap."""
        assert Settings(_env_file=None).loop_close_tolerance_m is None

    def test_a_threshold_can_be_restored_without_code_changes(self) -> None:
        assert Settings(_env_file=None, loop_close_tolerance_m=30.0).loop_close_tolerance_m == 30.0
