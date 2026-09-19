"""admin and player presence

Revision ID: 0004_admin_and_presence
Revises: 0003_player_id_and_clans
Create Date: 2026-09-19

Adds last_seen_at, last_lat, last_lon to demo_users for live presence
and admin real-time runner tracking.
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0004_admin_and_presence"
down_revision: str | None = "0003_player_id_and_clans"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE demo_users
          ADD COLUMN last_seen_at timestamptz NOT NULL DEFAULT now(),
          ADD COLUMN last_lat double precision,
          ADD COLUMN last_lon double precision;
        """
    )
    op.execute(
        "CREATE INDEX idx_demo_users_last_seen ON demo_users (last_seen_at DESC)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_demo_users_last_seen")
    op.execute(
        """
        ALTER TABLE demo_users
          DROP COLUMN IF EXISTS last_lon,
          DROP COLUMN IF EXISTS last_lat,
          DROP COLUMN IF EXISTS last_seen_at;
        """
    )
