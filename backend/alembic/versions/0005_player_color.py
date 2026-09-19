"""player color and building exclusion update

Revision ID: 0005_player_color
Revises: 0004_admin_and_presence
Create Date: 2026-09-19

Adds color_hex to demo_users with random bright gaming palette,
and updates existing players to have unique colors.
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0005_player_color"
down_revision: str | None = "0004_admin_and_presence"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Function to pick a vibrant gaming color for each new player
    op.execute(
        """
        CREATE OR REPLACE FUNCTION next_player_color() RETURNS text AS $$
        DECLARE
          colors text[] := ARRAY[
            '#00ff88', '#00e5ff', '#ff3b30', '#ffb800',
            '#af52de', '#ff2d55', '#30d158', '#007aff',
            '#ff9500', '#ffd60a', '#c7ff4a', '#00f2fe'
          ];
        BEGIN
          RETURN colors[floor(random() * array_length(colors, 1))::int + 1];
        END;
        $$ LANGUAGE plpgsql;
        """
    )

    op.execute(
        """
        ALTER TABLE demo_users
          ADD COLUMN color_hex text NOT NULL DEFAULT next_player_color();
        """
    )

    # Assign distinct random colors to any existing demo_users
    op.execute(
        """
        DO $$
        DECLARE existing record;
        BEGIN
          FOR existing IN SELECT id FROM demo_users LOOP
            UPDATE demo_users SET color_hex = next_player_color() WHERE id = existing.id;
          END LOOP;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE demo_users DROP COLUMN IF EXISTS color_hex")
    op.execute("DROP FUNCTION IF EXISTS next_player_color")
