"""runs, track points and solo territories

Revision ID: 0002_run_and_territory
Revises: 0001_initial_postgis
Create Date: 2026-09-17

The full users/clans schema lives in the main game TZ, which is not in this
repository. `demo_users` is deliberately named so that it cannot be mistaken
for it: it holds a browser-generated device key and exists only so a run has
an owner before real authentication is implemented.
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0002_run_and_territory"
down_revision: str | None = "0001_initial_postgis"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE demo_users (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          device_key text UNIQUE NOT NULL,
          display_name text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
        """
    )

    op.execute(
        """
        CREATE TABLE runs (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES demo_users(id) ON DELETE CASCADE,
          mode text NOT NULL DEFAULT 'solo',
          status text NOT NULL DEFAULT 'active',
          reason text,
          activity_type text,
          activity_confidence double precision,
          avg_speed_ms double precision,
          distance_m double precision,
          raw_area_m2 double precision,
          excluded_area_m2 double precision,
          awarded_area_m2 double precision,
          user_label text,
          started_at timestamptz NOT NULL DEFAULT now(),
          finished_at timestamptz,
          track geometry(LineString, 4326),
          CONSTRAINT runs_mode_check CHECK (mode IN ('solo', 'clan')),
          CONSTRAINT runs_status_check CHECK (status IN ('active', 'accepted', 'rejected'))
        )
        """
    )
    op.execute("CREATE INDEX idx_runs_user_started ON runs (user_id, started_at DESC)")
    # Anti-cheat rule 12: one active run per user at a time.
    op.execute(
        "CREATE UNIQUE INDEX idx_runs_one_active ON runs (user_id) WHERE status = 'active'"
    )

    op.execute(
        """
        CREATE TABLE track_points (
          id bigserial PRIMARY KEY,
          run_id uuid NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
          ts timestamptz NOT NULL,
          accuracy_m double precision,
          raw_speed_ms double precision,
          kalman_speed_ms double precision,
          mocked boolean NOT NULL DEFAULT false,
          geom geometry(Point, 4326) NOT NULL,
          UNIQUE (run_id, ts)
        )
        """
    )
    op.execute("CREATE INDEX idx_track_points_run ON track_points (run_id, ts)")
    op.execute("CREATE INDEX idx_track_points_geom ON track_points USING GIST (geom)")

    # `mode` keeps the solo and clan layers separate (CLAUDE.md rule 8).
    # Only solo is written today; clan ownership columns arrive with the clan
    # sprint so that nothing half-built is left behind here.
    op.execute(
        """
        CREATE TABLE territories (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          mode text NOT NULL DEFAULT 'solo',
          owner_user_id uuid NOT NULL REFERENCES demo_users(id) ON DELETE CASCADE,
          run_id uuid REFERENCES runs(id) ON DELETE SET NULL,
          area_m2 double precision NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          geom geometry(MultiPolygon, 4326) NOT NULL,
          CONSTRAINT territories_mode_check CHECK (mode IN ('solo', 'clan'))
        )
        """
    )
    op.execute("CREATE INDEX idx_territories_geom ON territories USING GIST (geom)")
    op.execute("CREATE INDEX idx_territories_mode_owner ON territories (mode, owner_user_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS territories")
    op.execute("DROP TABLE IF EXISTS track_points")
    op.execute("DROP TABLE IF EXISTS runs")
    op.execute("DROP TABLE IF EXISTS demo_users")
