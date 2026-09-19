"""Settings normalisation."""
import pytest

from app.config import Settings


def make(url: str) -> Settings:
    return Settings(_env_file=None, database_url=url)


class TestDatabaseUrl:
    @pytest.mark.parametrize(
        "url",
        [
            "postgres://user:pw@host:5432/dontstop",
            "postgresql://user:pw@host:5432/dontstop",
        ],
    )
    def test_a_managed_host_url_gets_the_async_driver(self, url: str) -> None:
        """Render and friends hand out a plain URL; SQLAlchemy needs asyncpg."""
        assert make(url).database_url.startswith("postgresql+asyncpg://")

    def test_the_rest_of_the_url_is_untouched(self) -> None:
        assert make("postgres://user:pw@host:5432/dontstop").database_url.endswith(
            "user:pw@host:5432/dontstop"
        )

    def test_an_explicit_driver_is_left_alone(self) -> None:
        url = "postgresql+asyncpg://user:pw@host:5432/dontstop"

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


class TestSizeFloors:
    def test_any_shape_the_runner_walks_counts(self) -> None:
        """Product decision: the TZ floors of 300 m and 2,000 m2 were removed."""
        settings = Settings(_env_file=None)

        assert settings.min_loop_perimeter_m == 1.0
        assert settings.min_area_m2 == 1.0

    def test_the_floors_can_be_restored_from_the_environment(self) -> None:
        settings = Settings(_env_file=None, min_loop_perimeter_m=300.0, min_area_m2=2000.0)

        assert settings.min_loop_perimeter_m == 300.0
        assert settings.min_area_m2 == 2000.0
