"""enable postgis and create region_boundaries and exclusion_zones

Revision ID: 0001_initial_postgis
Revises:
Create Date: 2026-09-17

Schema follows docs/TZ-noutbuk-dev-setup-v2.1.md section 12 verbatim.
DDL is written as raw SQL because the geometry types, the SRID and the
GiST index definitions come straight from the TZ.
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0001_initial_postgis"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # pgcrypto is not needed: gen_random_uuid() is core since PostgreSQL 13.
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.execute(
        """
        CREATE TABLE region_boundaries (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          code text UNIQUE NOT NULL,
          name text NOT NULL,
          level integer NOT NULL,
          is_open boolean NOT NULL DEFAULT false,
          source text NOT NULL,
          source_version text,
          imported_at timestamptz NOT NULL DEFAULT now(),
          geom geometry(MultiPolygon, 4326) NOT NULL
        )
        """
    )
    op.execute("CREATE INDEX idx_region_geom ON region_boundaries USING GIST (geom)")

    op.execute(
        """
        CREATE TABLE exclusion_zones (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          kind text NOT NULL,
          source text NOT NULL DEFAULT 'osm',
          osm_type text,
          osm_id bigint,
          updated_at timestamptz NOT NULL DEFAULT now(),
          geom geometry(MultiPolygon, 4326) NOT NULL,
          UNIQUE (source, osm_type, osm_id)
        )
        """
    )
    op.execute("CREATE INDEX idx_exclusion_geom ON exclusion_zones USING GIST (geom)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_exclusion_geom")
    op.execute("DROP TABLE IF EXISTS exclusion_zones")
    op.execute("DROP INDEX IF EXISTS idx_region_geom")
    op.execute("DROP TABLE IF EXISTS region_boundaries")
    # The postgis extension is deliberately left in place: the postgis/postgis
    # image creates it during initdb, so dropping it here would take the
    # database below its own baseline state.
