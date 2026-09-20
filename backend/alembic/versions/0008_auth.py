"""auth credentials (username + password_hash)

Revision ID: 0008_auth
Revises: 0007_notifications
Create Date: 2026-09-20

Adds username and password_hash to demo_users so players can register
with a username+password instead of only a device key.

  username      — unique, 3-32 chars, letters/digits/underscore
  password_hash — bcrypt hash, NULL for device-key-only accounts
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0008_auth"
down_revision: str | None = "0007_notifications"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "demo_users",
        sa.Column("username", sa.String(32), nullable=True, unique=True),
    )
    op.add_column(
        "demo_users",
        sa.Column("password_hash", sa.Text(), nullable=True),
    )
    op.create_index("ix_demo_users_username", "demo_users", ["username"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_demo_users_username", table_name="demo_users")
    op.drop_column("demo_users", "password_hash")
    op.drop_column("demo_users", "username")
