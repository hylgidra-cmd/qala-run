"""email (Gmail) and Google account auth

Revision ID: 0011_email_and_google_auth
Revises: 0010_chat
Create Date: 2026-11-02

Adds `email` (Gmail address) and `google_sub` (Google account identifier)
to `demo_users`.
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0011_email_and_google_auth"
down_revision: str | None = "0010_chat"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "demo_users",
        sa.Column("email", sa.String(255), nullable=True, unique=True),
    )
    op.add_column(
        "demo_users",
        sa.Column("google_sub", sa.String(255), nullable=True, unique=True),
    )
    op.create_index("ix_demo_users_email", "demo_users", ["email"], unique=True)
    op.create_index("ix_demo_users_google_sub", "demo_users", ["google_sub"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_demo_users_google_sub", table_name="demo_users")
    op.drop_index("ix_demo_users_email", table_name="demo_users")
    op.drop_column("demo_users", "google_sub")
    op.drop_column("demo_users", "email")
