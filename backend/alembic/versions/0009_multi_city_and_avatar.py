"""multi-city support and avatar image

Revision ID: 0009_multi_city_and_avatar
Revises: 0008_auth
Create Date: 2026-09-20

Adds `city` (default 'nukus') and `avatar_data` (base64 image) to `demo_users`.
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0009_multi_city_and_avatar"
down_revision: str | None = "0008_auth"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "demo_users",
        sa.Column("city", sa.String(32), server_default="nukus", nullable=False),
    )
    op.add_column(
        "demo_users",
        sa.Column("avatar_data", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("demo_users", "avatar_data")
    op.drop_column("demo_users", "city")
