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
        assert Settings(_env_file=None).pilot_bbox == (59.45, 42.36, 59.75, 42.55)


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


class TestAdminKey:
    def test_admin_key_has_default_and_can_be_overridden(self) -> None:
        assert Settings(_env_file=None).admin_key == "dontstop-admin-2026"
        assert Settings(_env_file=None, ADMIN_KEY="custom-secret").admin_key == "custom-secret"


class TestGmailValidation:
    def test_accepts_valid_gmail_and_normalizes_case(self) -> None:
        from app.api.auth import validate_gmail_address

        assert validate_gmail_address("  Runner.Nukus+1@Gmail.com ") == "runner.nukus+1@gmail.com"

    def test_rejects_non_gmail_or_empty_addresses(self) -> None:
        from app.api.auth import validate_gmail_address

        with pytest.raises(ValueError):
            validate_gmail_address("")
        with pytest.raises(ValueError):
            validate_gmail_address("runner@yahoo.com")
        with pytest.raises(ValueError):
            validate_gmail_address("invalid-email")


class TestSubscriptionLogic:
    def test_new_user_gets_three_day_free_trial(self) -> None:
        from datetime import UTC, datetime

        from app.api.players import compute_subscription

        now = datetime(2026, 11, 11, 12, 0, tzinfo=UTC)
        sub = compute_subscription(created_at=now, trial_ends_at=None, paid_until=None, now=now)

        assert sub.status == "trial"
        assert sub.is_active is True
        assert sub.days_left == 3
        assert sub.daily_price_uzs == 5000

    def test_expired_trial_requires_subscription_until_paid(self) -> None:
        from datetime import UTC, datetime, timedelta

        from app.api.players import compute_subscription

        created = datetime(2026, 11, 1, 12, 0, tzinfo=UTC)
        now = created + timedelta(days=4)

        expired = compute_subscription(
            created_at=created,
            trial_ends_at=created + timedelta(days=3),
            paid_until=None,
            now=now,
        )
        assert expired.status == "expired"
        assert expired.is_active is False

        active = compute_subscription(
            created_at=created,
            trial_ends_at=created + timedelta(days=3),
            paid_until=now + timedelta(days=1),
            now=now,
        )
        assert active.status == "active"
        assert active.is_active is True
        assert active.days_left == 1

