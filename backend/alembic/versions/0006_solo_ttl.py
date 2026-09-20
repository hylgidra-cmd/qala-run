"""solo territory TTL (expires_at column)

Revision ID: 0006_solo_ttl
Revises: 0005_player_color
Create Date: 2026-09-19

TZ section 23.2: solo territories expire after 7 days, clan territories
expire after 14 days.  We store the deadline in an `expires_at` column so
the query is a simple index scan rather than an arithmetic expression.

Existing rows (created before this migration) get a back-filled deadline
so they are not deleted on the first cleanup run:
  - solo  → created_at + 7 days
  - clan  → created_at + 14 days
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0006_solo_ttl"
down_revision: str | None = "0005_player_color"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add nullable first so we can back-fill existing rows
    op.add_column(
        "territories",
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Back-fill existing rows
    op.execute(
        """
        UPDATE territories
           SET expires_at = CASE
               WHEN mode = 'solo' THEN created_at + INTERVAL '7 days'
               ELSE                    created_at + INTERVAL '14 days'
           END
        """
    )

    # Index so the cleanup query is fast
    op.create_index("ix_territories_expires_at", "territories", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_territories_expires_at", table_name="territories")
    op.drop_column("territories", "expires_at")

