"""Ranks, weekly windows and streaks, shared by the player, clan and run APIs.

Two different things are called "area" on a leaderboard and they must not be
mixed up:

* all-time standing is the ground a player **holds now** (unexpired
  territories), so losing ground to someone moves you down;
* weekly standing is the ground **awarded** by runs finished since Monday,
  so it only ever grows during the week.

Days and weeks are counted in the city's own timezone: a run at 01:00 in
Nukus belongs to that Nukus day, whatever the server clock says.
"""
from datetime import UTC, date, datetime, timedelta
from typing import Literal
from zoneinfo import ZoneInfo

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.geo.cities import get_city

Period = Literal["all", "week"]

# Never a real cutoff: it lets one query serve both periods.
_EPOCH = datetime(1970, 1, 1, tzinfo=UTC)


def city_timezone(city_id: str | None) -> ZoneInfo:
    return ZoneInfo(get_city(city_id).tz)


def week_start(city_id: str | None, now: datetime | None = None) -> datetime:
    """Monday 00:00 of the current week in the city's timezone."""
    local_now = (now or datetime.now(UTC)).astimezone(city_timezone(city_id))
    monday = local_now.date() - timedelta(days=local_now.weekday())
    return datetime(monday.year, monday.month, monday.day, tzinfo=local_now.tzinfo)


def streak_length(run_days: list[date], today: date) -> int:
    """Consecutive days with a run, ending today or yesterday.

    Yesterday still counts so that a streak is not shown as lost on a day the
    player simply has not run *yet*.
    """
    days = sorted(set(run_days), reverse=True)
    if not days or days[0] < today - timedelta(days=1):
        return 0

    length = 1
    for previous, current in zip(days, days[1:], strict=False):
        if previous - current != timedelta(days=1):
            break
        length += 1
    return length


def solo_area_sql(period: Period) -> str:
    """SQL for one player's (`u.id`) solo area in the given period."""
    if period == "week":
        return """
            COALESCE(
                (SELECT sum(r.awarded_area_m2) FROM runs r
                  WHERE r.user_id = u.id
                    AND r.mode = 'solo'
                    AND r.status = 'accepted'
                    AND r.finished_at >= :since),
                0
            )
        """
    return """
        COALESCE(
            (SELECT sum(t.area_m2) FROM territories t
              WHERE t.mode = 'solo'
                AND t.owner_user_id = u.id
                AND (t.expires_at IS NULL OR t.expires_at > now())),
            0
        )
    """


def since_for(period: Period, city_id: str | None) -> datetime:
    return week_start(city_id) if period == "week" else _EPOCH


async def solo_rank(
    connection: AsyncConnection,
    user_id: str,
    city_id: str | None,
    period: Period = "all",
) -> tuple[int, float]:
    """The player's place among the solo players of a city, and their area.

    Ties share a place (1, 2, 2, 4), so a player is never ranked below
    someone they are level with.
    """
    row = (
        await connection.execute(
            text(
                f"""
                WITH standing AS (
                    SELECT u.id, {solo_area_sql(period)} AS area
                      FROM demo_users u
                     WHERE lower(u.city) = lower(:city) OR u.id = :user_id
                )
                SELECT mine.area AS area,
                       1 + (SELECT count(*) FROM standing s WHERE s.area > mine.area) AS place
                  FROM standing mine
                 WHERE mine.id = :user_id
                """
            ),
            {
                "user_id": user_id,
                "city": get_city(city_id).id,
                "since": since_for(period, city_id),
            },
        )
    ).one_or_none()

    if row is None:
        return 1, 0.0
    return int(row.place), float(row.area)


async def clan_rank(connection: AsyncConnection, clan_id: str) -> int:
    """A clan's place by the ground it holds now. Clans are not tied to a city."""
    place = await connection.scalar(
        text(
            """
            WITH standing AS (
                SELECT c.id,
                       COALESCE(
                           (SELECT sum(t.area_m2) FROM territories t
                             WHERE t.mode = 'clan'
                               AND t.owner_clan_id = c.id
                               AND (t.expires_at IS NULL OR t.expires_at > now())),
                           0
                       ) AS area
                  FROM clans c
            )
            SELECT 1 + (SELECT count(*) FROM standing s WHERE s.area > mine.area)
              FROM standing mine
             WHERE mine.id = :clan_id
            """
        ),
        {"clan_id": clan_id},
    )
    return int(place or 1)


async def run_streak(connection: AsyncConnection, user_id: str, city_id: str | None) -> int:
    """Days in a row with at least one accepted run, in the city's timezone."""
    zone = city_timezone(city_id)
    rows = (
        await connection.execute(
            text(
                """
                SELECT DISTINCT (finished_at AT TIME ZONE :tz)::date AS day
                  FROM runs
                 WHERE user_id = :user_id
                   AND status = 'accepted'
                   AND finished_at IS NOT NULL
                 ORDER BY day DESC
                 LIMIT 400
                """
            ),
            {"user_id": user_id, "tz": zone.key},
        )
    ).all()

    return streak_length([row.day for row in rows], datetime.now(zone).date())
