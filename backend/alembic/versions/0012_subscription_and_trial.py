"""3-day free trial and daily subscription (5,000 UZS/day)

Revision ID: 0012_subscription_and_trial
Revises: 0011_email_and_google_auth
Create Date: 2026-11-11

Adds `trial_ends_at` (defaults to created_at + 3 days) and `paid_until`
to `demo_users`.
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0012_subscription_and_trial"
down_revision: str | None = "0011_email_and_google_auth"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "demo_users",
        sa.Column(
            "trial_ends_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now() + interval '3 days'"),
            nullable=True,
        ),
    )
    op.add_column(
        "demo_users",
        sa.Column("paid_until", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute(
        """
        UPDATE demo_users
           SET trial_ends_at = COALESCE(created_at, now()) + interval '3 days'
         WHERE trial_ends_at IS NULL
        """
    )


def downgrade() -> None:
    op.drop_column("demo_users", "paid_until")
    op.drop_column("demo_users", "trial_ends_at")
