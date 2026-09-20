"""notifications table

Revision ID: 0007_notifications
Revises: 0006_solo_ttl
Create Date: 2026-09-20

In-app notifications for territory invasion events.
When player B captures ground that belonged to player A,
a notification row is inserted for player A.
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0007_notifications"
down_revision: str | None = "0006_solo_ttl"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(), sa.ForeignKey("demo_users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),  # 'territory_invaded'
        sa.Column("payload", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_user_unread", "notifications", ["user_id", "created_at"],
                    postgresql_where=sa.text("read_at IS NULL"))


def downgrade() -> None:
    op.drop_index("ix_notifications_user_unread", table_name="notifications")
    op.drop_table("notifications")
