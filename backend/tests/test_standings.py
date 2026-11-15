"""Ranks, weekly windows and streaks."""
import uuid
from datetime import UTC, date, datetime, timedelta

import pytest
from helpers import NUKUS_LON, run_track, square_points
from sqlalchemy import text

from app.api.standings import streak_length, week_start


def device(prefix: str) -> dict[str, str]:
    return {"X-Demo-User": f"{prefix}{uuid.uuid4().hex}"[:32]}


async def walk_square(client, headers, side_m: float, lon_offset: float = 0.0):
    """An accepted solo square; the offset keeps players off each other's ground."""
    _, finished = await run_track(
        client, headers, square_points(side_m=side_m, lon=NUKUS_LON + lon_offset)
    )
    assert finished.json()["status"] == "accepted", finished.text
    return finished.json()


class TestWeekStart:
    def test_the_week_starts_on_monday_at_local_midnight(self) -> None:
        # Sunday 20:30 UTC is already Monday 01:30 in Nukus (UTC+5).
        now = datetime(2026, 11, 15, 20, 30, tzinfo=UTC)

        start = week_start("nukus", now)

        assert start.astimezone(UTC) == datetime(2026, 11, 15, 19, 0, tzinfo=UTC)

    def test_another_city_keeps_its_own_week(self) -> None:
        # The same instant is still Sunday 23:30 in Istanbul (UTC+3).
        now = datetime(2026, 11, 15, 20, 30, tzinfo=UTC)

        start = week_start("istanbul", now)

        assert start.astimezone(UTC) == datetime(2026, 11, 8, 21, 0, tzinfo=UTC)


class TestStreakLength:
    today = date(2026, 11, 15)

    def days_ago(self, *offsets: int) -> list[date]:
        return [self.today - timedelta(days=offset) for offset in offsets]

    def test_no_runs_is_no_streak(self) -> None:
        assert streak_length([], self.today) == 0

    def test_consecutive_days_ending_today_are_counted(self) -> None:
        assert streak_length(self.days_ago(0, 1, 2, 3), self.today) == 4

    def test_a_streak_survives_until_the_end_of_the_next_day(self) -> None:
        assert streak_length(self.days_ago(1, 2), self.today) == 2

    def test_a_missed_day_ends_it(self) -> None:
        assert streak_length(self.days_ago(2, 3, 4), self.today) == 0

    def test_only_the_latest_unbroken_stretch_counts(self) -> None:
        assert streak_length(self.days_ago(0, 1, 3, 4, 5), self.today) == 2

    def test_two_runs_on_one_day_are_one_day(self) -> None:
        assert streak_length(self.days_ago(0, 0, 1), self.today) == 2


class TestProfileStats:
    async def test_a_new_player_has_no_streak_and_no_longest_run(self, client) -> None:
        stats = (await client.get("/api/v1/me", headers=device("st1"))).json()["stats"]

        assert stats["streak_days"] == 0
        assert stats["longest_run_m"] == 0.0
        assert stats["city_rank"] >= 1

    async def test_a_run_starts_a_streak_and_sets_the_longest_run(self, client) -> None:
        headers = device("st2")
        result = await walk_square(client, headers, 100.0)

        stats = (await client.get("/api/v1/me", headers=headers)).json()["stats"]

        assert stats["streak_days"] == 1
        assert stats["longest_run_m"] == pytest.approx(result["distance_m"])
        assert stats["longest_run_m"] == pytest.approx(400.0, rel=0.05)

    async def test_yesterdays_run_extends_the_streak(self, client, connection) -> None:
        headers = device("st3")
        first = await walk_square(client, headers, 80.0)
        await connection.execute(
            text("UPDATE runs SET finished_at = finished_at - interval '1 day' WHERE id = :id"),
            {"id": first["run_id"]},
        )
        await walk_square(client, headers, 80.0, lon_offset=0.01)

        stats = (await client.get("/api/v1/me", headers=headers)).json()["stats"]

        assert stats["streak_days"] == 2

    async def test_more_ground_means_a_better_place(self, client) -> None:
        small, large = device("st4"), device("st5")
        await walk_square(client, small, 60.0)
        await walk_square(client, large, 150.0, lon_offset=0.02)

        small_rank = (await client.get("/api/v1/me", headers=small)).json()["stats"]["city_rank"]
        large_rank = (await client.get("/api/v1/me", headers=large)).json()["stats"]["city_rank"]

        assert large_rank < small_rank


class TestRunResult:
    async def test_it_reports_the_measured_distance_and_time(self, client) -> None:
        result = await walk_square(client, device("rr1"), 120.0)

        assert result["distance_m"] == pytest.approx(480.0, rel=0.05)
        # One fix per second at 1.4 m/s.
        assert result["duration_s"] == pytest.approx(480.0 / 1.4, rel=0.05)

    async def test_capturing_ground_never_costs_a_place(self, client) -> None:
        leader, runner = device("rr2"), device("rr3")
        await walk_square(client, leader, 100.0)
        await client.get("/api/v1/me", headers=runner)

        result = await walk_square(client, runner, 160.0, lon_offset=0.02)

        assert result["rank_after"] < result["rank_before"]
        assert result["rank_after"] >= 1

    async def test_a_rejected_run_moves_no_place(self, client) -> None:
        headers = device("rr4")
        started = await client.post("/api/v1/runs/start", headers=headers)
        run_id = started.json()["run_id"]

        finished = await client.post(f"/api/v1/runs/{run_id}/finish", headers=headers)

        body = finished.json()
        assert body["status"] == "rejected"
        assert body["rank_before"] is None and body["rank_after"] is None


class TestLeaderboardPeriods:
    async def test_last_weeks_ground_counts_all_time_but_not_this_week(
        self, client, connection
    ) -> None:
        headers = device("lb1")
        old = await walk_square(client, headers, 100.0)
        await connection.execute(
            text("UPDATE runs SET finished_at = finished_at - interval '8 days' WHERE id = :id"),
            {"id": old["run_id"]},
        )

        all_time = (await client.get("/api/v1/players/leaderboard/me", headers=headers)).json()
        this_week = (
            await client.get("/api/v1/players/leaderboard/me?period=week", headers=headers)
        ).json()

        assert all_time["total_area_m2"] == pytest.approx(old["awarded_area_m2"])
        assert all_time["period"] == "all" and all_time["city"] == "nukus"
        assert this_week["total_area_m2"] == 0.0

    async def test_the_weekly_board_lists_this_weeks_ground(self, client) -> None:
        headers = device("lb2")
        result = await walk_square(client, headers, 100.0)
        me = (await client.get("/api/v1/me", headers=headers)).json()

        board = (
            await client.get("/api/v1/players/leaderboard?city=nukus&period=week&limit=100")
        ).json()

        mine = next(row for row in board if row["user_id"] == me["user_id"])
        assert mine["total_area_m2"] == pytest.approx(result["awarded_area_m2"])
        assert mine["runs_count"] == 1

    async def test_an_unknown_period_is_refused(self, client) -> None:
        response = await client.get("/api/v1/players/leaderboard?period=year")

        assert response.status_code == 422


class TestClanStandings:
    async def test_a_clan_shows_what_each_member_won_this_week(self, client) -> None:
        founder = device("cs1")
        clan = (
            await client.post(
                "/api/v1/clans",
                headers=founder,
                json={"name": "Hafta sinovi", "tag": "WK1", "color_hex": "#2F6BFF"},
            )
        ).json()
        run_id = (
            await client.post("/api/v1/runs/start?mode=clan", headers=founder)
        ).json()["run_id"]
        await client.post(
            f"/api/v1/runs/{run_id}/points",
            headers=founder,
            json={"points": square_points(side_m=100.0, lon=NUKUS_LON + 0.03)},
        )
        result = (await client.post(f"/api/v1/runs/{run_id}/finish", headers=founder)).json()
        assert result["status"] == "accepted", result

        seen = (await client.get(f"/api/v1/clans/{clan['id']}", headers=founder)).json()

        assert seen["rank"] >= 1
        assert seen["week_area_m2"] == pytest.approx(result["awarded_area_m2"])
        assert seen["members"][0]["week_area_m2"] == pytest.approx(result["awarded_area_m2"])
        assert seen["members"][0]["color_hex"].startswith("#")
        # Clan ground has no solo place to move.
        assert result["rank_before"] is None and result["rank_after"] is None


class TestOnlineCount:
    async def test_it_counts_recently_active_players_of_the_city(self, client) -> None:
        headers = device("on1")
        before = (await client.get("/api/v1/chat/online?city=nukus", headers=headers)).json()
        await client.get("/api/v1/me", headers=device("on2"))

        after = (await client.get("/api/v1/chat/online?city=nukus", headers=headers)).json()

        assert before["online"] >= 1
        assert after["online"] == before["online"] + 1

    async def test_it_is_not_public(self, client) -> None:
        assert (await client.get("/api/v1/chat/online")).status_code == 401
