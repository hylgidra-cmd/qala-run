"""Integration checks for the 0001_initial_postgis migration.

These tests need the compose database. Run them where DATABASE_URL resolves:

    docker compose exec api alembic upgrade head
    docker compose exec api python -m pytest tests -q
"""
import pytest
from asyncpg.exceptions import PostgresConnectionError
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, InterfaceError, OperationalError
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from app.config import get_settings

# Bump this with every migration: it is the guard against a stale database.
HEAD_REVISION = "0010_chat"

# A small square inside the Nukus pilot bbox (59.58,42.43,59.64,42.48).
SQUARE_WKT = "POLYGON((59.600 42.450, 59.601 42.450, 59.601 42.451, 59.600 42.451, 59.600 42.450))"

UNIQUE_CONSTRAINTS_SQL = text(
    """
    SELECT (SELECT array_agg(a.attname ORDER BY a.attname)
              FROM unnest(c.conkey) AS k(attnum)
              JOIN pg_attribute a
                ON a.attrelid = c.conrelid AND a.attnum = k.attnum) AS columns
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
     WHERE t.relname = :table AND c.contype = 'u'
    """
)

# Tables that still belong to later prompts. `runs` and `territories` moved
# out of this list with migration 0002 and the clan tables with 0003; `users`
# stays because demo_users is a stand-in, not the real authenticated user table.
FUTURE_TABLES = {"users"}


@pytest.fixture
async def connection():
    """A connection on a throwaway engine.

    The engine from app.db is cached for the application lifetime, so its pool
    would outlive the per-test event loop. Each test gets its own NullPool
    engine instead.
    """
    engine = create_async_engine(get_settings().database_url, poolclass=NullPool)

    try:
        conn = await engine.connect()
    except (OperationalError, InterfaceError, OSError, PostgresConnectionError) as exc:
        await engine.dispose()
        pytest.skip(f"database not reachable ({type(exc).__name__}); start it with docker compose")

    try:
        yield conn
    finally:
        await conn.close()
        await engine.dispose()


async def test_postgis_extension_is_enabled(connection) -> None:
    name = await connection.scalar(
        text("SELECT extname FROM pg_extension WHERE extname = 'postgis'")
    )

    assert name == "postgis"


async def test_migration_is_at_head_revision(connection) -> None:
    version = await connection.scalar(text("SELECT version_num FROM alembic_version"))

    assert version == HEAD_REVISION


@pytest.mark.parametrize("table", ["region_boundaries", "exclusion_zones", "territories"])
async def test_geom_is_multipolygon_in_srid_4326(connection, table: str) -> None:
    result = await connection.execute(
        text(
            "SELECT type, srid FROM geometry_columns "
            "WHERE f_table_name = :table AND f_geometry_column = 'geom'"
        ),
        {"table": table},
    )
    row = result.one_or_none()

    assert row is not None, f"{table}.geom is not registered in geometry_columns"
    assert row.type == "MULTIPOLYGON"
    assert row.srid == 4326


@pytest.mark.parametrize(
    ("table", "index"),
    [
        ("region_boundaries", "idx_region_geom"),
        ("exclusion_zones", "idx_exclusion_geom"),
        ("territories", "idx_territories_geom"),
        ("track_points", "idx_track_points_geom"),
    ],
)
async def test_geom_index_is_gist(connection, table: str, index: str) -> None:
    definition = await connection.scalar(
        text("SELECT indexdef FROM pg_indexes WHERE tablename = :table AND indexname = :index"),
        {"table": table, "index": index},
    )

    assert definition is not None, f"{index} is missing"
    assert "USING gist" in definition


async def test_region_boundaries_unique_constraints(connection) -> None:
    rows = (await connection.execute(UNIQUE_CONSTRAINTS_SQL, {"table": "region_boundaries"})).all()

    assert [sorted(row.columns) for row in rows] == [["code"]]


async def test_exclusion_zones_unique_constraints(connection) -> None:
    rows = (await connection.execute(UNIQUE_CONSTRAINTS_SQL, {"table": "exclusion_zones"})).all()

    assert [sorted(row.columns) for row in rows] == [["osm_id", "osm_type", "source"]]


async def test_duplicate_osm_object_cannot_be_imported_twice(connection) -> None:
    """UNIQUE (source, osm_type, osm_id) is what makes OSM import idempotent."""
    transaction = await connection.begin()
    insert = text(
        """
        INSERT INTO exclusion_zones (kind, source, osm_type, osm_id, geom)
        VALUES (:kind, 'osm', 'way', :osm_id, ST_Multi(ST_GeomFromText(:wkt, 4326)))
        """
    )
    params = {"kind": "building", "osm_id": -1, "wkt": SQUARE_WKT}

    try:
        await connection.execute(insert, params)

        with pytest.raises(IntegrityError):
            await connection.execute(insert, params)
    finally:
        await transaction.rollback()


async def test_region_geometry_round_trips_in_srid_4326(connection) -> None:
    transaction = await connection.begin()

    try:
        srid = await connection.scalar(
            text(
                """
                INSERT INTO region_boundaries (code, name, level, source, geom)
                VALUES ('TEST-NUKUS', 'Test region', 1, 'test',
                        ST_Multi(ST_GeomFromText(:wkt, 4326)))
                RETURNING ST_SRID(geom)
                """
            ),
            {"wkt": SQUARE_WKT},
        )

        assert srid == 4326
    finally:
        await transaction.rollback()


async def test_later_sprint_tables_do_not_exist_yet(connection) -> None:
    names = set(
        (
            await connection.scalars(
                text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
            )
        ).all()
    )

    assert names & FUTURE_TABLES == set()


async def test_only_one_run_can_be_active_per_user(connection) -> None:
    """Anti-cheat rule 12 is enforced by a partial unique index, not by code."""
    definition = await connection.scalar(
        text("SELECT indexdef FROM pg_indexes WHERE indexname = 'idx_runs_one_active'")
    )

    assert definition is not None
    assert "UNIQUE" in definition
    assert "status = 'active'" in definition


async def test_territory_mode_is_constrained_to_solo_and_clan(connection) -> None:
    """CLAUDE.md rule 8: the two modes stay separate."""
    transaction = await connection.begin()

    try:
        with pytest.raises(IntegrityError):
            await connection.execute(
                text(
                    """
                    INSERT INTO territories (mode, owner_user_id, area_m2, geom)
                    VALUES ('guild', gen_random_uuid(), 1.0,
                            ST_Multi(ST_GeomFromText(:wkt, 4326)))
                    """
                ),
                {"wkt": SQUARE_WKT},
            )
    finally:
        await transaction.rollback()


async def test_every_player_gets_an_eight_digit_id(connection) -> None:
    """The id is what a player reads out to a friend, like PUBG or Free Fire."""
    transaction = await connection.begin()

    try:
        first = await connection.scalar(
            text(
                "INSERT INTO demo_users (device_key) VALUES ('schema-probe-1') "
                "RETURNING player_id"
            )
        )
        second = await connection.scalar(
            text(
                "INSERT INTO demo_users (device_key) VALUES ('schema-probe-2') "
                "RETURNING player_id"
            )
        )

        assert len(first) == 8 and first.isdigit() and not first.startswith("0")
        assert first != second
    finally:
        await transaction.rollback()


async def test_a_player_id_cannot_be_reused(connection) -> None:
    transaction = await connection.begin()

    try:
        taken = await connection.scalar(
            text(
                "INSERT INTO demo_users (device_key) VALUES ('schema-probe-3') "
                "RETURNING player_id"
            )
        )

        with pytest.raises(IntegrityError):
            await connection.execute(
                text(
                    "INSERT INTO demo_users (device_key, player_id) "
                    "VALUES ('schema-probe-4', :player_id)"
                ),
                {"player_id": taken},
            )
    finally:
        await transaction.rollback()


async def test_a_new_player_is_named_after_their_id(connection) -> None:
    transaction = await connection.begin()

    try:
        row = (
            await connection.execute(
                text(
                    "INSERT INTO demo_users (device_key) VALUES ('schema-probe-5') "
                    "RETURNING player_id, display_name"
                )
            )
        ).one()

        assert row.display_name.endswith(row.player_id)
    finally:
        await transaction.rollback()


async def test_a_clan_stops_at_ten_members(connection) -> None:
    """TZ section 23.2 puts the limit in the database, not in an endpoint."""
    transaction = await connection.begin()

    try:
        clan_id = await connection.scalar(
            text(
                "INSERT INTO clans (name, tag, color_hex) "
                "VALUES ('Schema probe', 'SPRB', '#c7ff4a') RETURNING id"
            )
        )

        for seat in range(11):
            user_id = await connection.scalar(
                text("INSERT INTO demo_users (device_key) VALUES (:key) RETURNING id"),
                {"key": f"schema-clan-{seat}"},
            )
            insert = text(
                "INSERT INTO clan_members (user_id, clan_id) VALUES (:user_id, :clan_id)"
            )
            params = {"user_id": user_id, "clan_id": clan_id}

            if seat < 10:
                await connection.execute(insert, params)
            else:
                with pytest.raises(IntegrityError):
                    await connection.execute(insert, params)
    finally:
        await transaction.rollback()


async def test_clan_ground_cannot_be_stored_without_a_clan(connection) -> None:
    """CLAUDE.md rule 8: a clan territory belongs to a clan, a solo one does not."""
    transaction = await connection.begin()

    try:
        with pytest.raises(IntegrityError):
            await connection.execute(
                text(
                    """
                    INSERT INTO territories (mode, owner_user_id, owner_clan_id, area_m2, geom)
                    VALUES ('clan', gen_random_uuid(), NULL, 1.0,
                            ST_Multi(ST_GeomFromText(:wkt, 4326)))
                    """
                ),
                {"wkt": SQUARE_WKT},
            )
    finally:
        await transaction.rollback()
