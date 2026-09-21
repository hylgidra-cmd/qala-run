"""chat_messages table

Revision ID: 0010_chat
Revises: 0009_multi_city_and_avatar
Create Date: 2026-09-21

Chat system: global (city-wide), clan, and direct player-to-player messaging
with location sharing support.
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0010_chat"
down_revision: str | None = "0009_multi_city_and_avatar"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE chat_messages (
          id bigserial PRIMARY KEY,
          channel_type text NOT NULL,
          channel_id text NOT NULL,
          sender_id uuid NOT NULL REFERENCES demo_users(id) ON DELETE CASCADE,
          recipient_id uuid REFERENCES demo_users(id) ON DELETE CASCADE,
          content text NOT NULL,
          msg_type text NOT NULL DEFAULT 'text',
          payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          read_at timestamptz,
          CONSTRAINT chat_channel_type_check CHECK (channel_type IN ('global', 'clan', 'direct')),
          CONSTRAINT chat_msg_type_check CHECK (msg_type IN ('text', 'location'))
        )
        """
    )
    op.execute(
        "CREATE INDEX idx_chat_channel_created ON chat_messages (channel_type, channel_id, created_at DESC)"
    )
    op.execute(
        "CREATE INDEX idx_chat_recipient_unread ON chat_messages (recipient_id, created_at DESC) WHERE read_at IS NULL"
    )



def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS chat_messages CASCADE;")
