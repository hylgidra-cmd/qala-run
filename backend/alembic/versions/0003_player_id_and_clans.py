"""player ids, clans and clan-owned territory

Revision ID: 0003_player_id_and_clans
Revises: 0002_run_and_territory
Create Date: 2026-09-19

Every player gets an 8-digit id of their own, the way PUBG and Free Fire hand
one out, and clans get their own territory layer that never mixes with solo
(CLAUDE.md rule 8, TZ section 23).
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0003_player_id_and_clans"
down_revision: str | None = "0002_run_and_territory"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Eight digits, never starting with a zero, so the id is always the same
    # length when it is read out loud. The loop keeps picking until it finds a
    # free one; the unique index is what actually guarantees it.
    op.execute(
        """
        CREATE FUNCTION next_player_id() RETURNS text AS $$
        DECLARE candidate text;
        BEGIN
          LOOP
            candidate := (floor(random() * 90000000) + 10000000)::bigint::text;
            EXIT WHEN NOT EXISTS (SELECT 1 FROM demo_users WHERE player_id = candidate);
          END LOOP;
          RETURN candidate;
        END;
        $$ LANGUAGE plpgsql
        """
    )

    op.execute("ALTER TABLE demo_users ADD COLUMN player_id text")
    op.execute(
        """
        DO $$
        DECLARE existing record;
        BEGIN
          FOR existing IN SELECT id FROM demo_users WHERE player_id IS NULL LOOP
            UPDATE demo_users SET player_id = next_player_id() WHERE id = existing.id;
          END LOOP;
        END $$
        """
    )
    op.execute("ALTER TABLE demo_users ALTER COLUMN player_id SET NOT NULL")
    op.execute("ALTER TABLE demo_users ALTER COLUMN player_id SET DEFAULT next_player_id()")
    op.execute("CREATE UNIQUE INDEX idx_demo_users_player_id ON demo_users (player_id)")
    op.execute(
        "ALTER TABLE demo_users ADD CONSTRAINT demo_users_player_id_check "
        "CHECK (player_id ~ '^[1-9][0-9]{7}$')"
    )

    # A new browser should already read as a player, so the name is derived
    # from the id it was just given rather than from the device key.
    op.execute("ALTER TABLE demo_users ALTER COLUMN display_name SET DEFAULT ''")
    op.execute(
        """
        CREATE FUNCTION default_display_name() RETURNS trigger AS $$
        BEGIN
          IF NEW.display_name IS NULL OR btrim(NEW.display_name) = '' THEN
            NEW.display_name := 'Oyınshı ' || NEW.player_id;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
        """
    )
    op.execute(
        """
        CREATE TRIGGER demo_users_default_display_name
        BEFORE INSERT ON demo_users
        FOR EACH ROW EXECUTE FUNCTION default_display_name()
        """
    )

    op.execute(
        """
        CREATE FUNCTION next_invite_code() RETURNS text AS $$
        DECLARE alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                candidate text;
                index integer;
        BEGIN
          LOOP
            candidate := '';
            FOR index IN 1..6 LOOP
              candidate := candidate
                || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
            END LOOP;
            EXIT WHEN NOT EXISTS (SELECT 1 FROM clans WHERE invite_code = candidate);
          END LOOP;
          RETURN candidate;
        END;
        $$ LANGUAGE plpgsql
        """
    )

    # TZ section 23.3 fixes the field lengths; they are checked here as well as
    # in the API so a bad row cannot be written by any other route.
    op.execute(
        """
        CREATE TABLE clans (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          tag text NOT NULL,
          color_hex text NOT NULL,
          invite_code text NOT NULL,
          created_by uuid REFERENCES demo_users(id) ON DELETE SET NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT clans_name_check CHECK (char_length(name) BETWEEN 3 AND 48),
          CONSTRAINT clans_tag_check CHECK (tag ~ '^[A-Z0-9]{2,5}$'),
          CONSTRAINT clans_color_check CHECK (color_hex ~ '^#[0-9a-fA-F]{6}$')
        )
        """
    )
    op.execute("CREATE UNIQUE INDEX idx_clans_invite_code ON clans (invite_code)")
    op.execute("CREATE UNIQUE INDEX idx_clans_tag ON clans (upper(tag))")
    op.execute("ALTER TABLE clans ALTER COLUMN invite_code SET DEFAULT next_invite_code()")

    # One clan per player: the primary key on user_id is what enforces it.
    op.execute(
        """
        CREATE TABLE clan_members (
          user_id uuid PRIMARY KEY REFERENCES demo_users(id) ON DELETE CASCADE,
          clan_id uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
          role text NOT NULL DEFAULT 'member',
          joined_at timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT clan_members_role_check CHECK (role IN ('owner', 'officer', 'member'))
        )
        """
    )
    op.execute("CREATE INDEX idx_clan_members_clan ON clan_members (clan_id)")

    # TZ section 23.2: ten members, enforced by the database rather than by
    # whichever endpoint happens to be adding them.
    op.execute(
        """
        CREATE FUNCTION enforce_clan_size() RETURNS trigger AS $$
        BEGIN
          IF (SELECT count(*) FROM clan_members WHERE clan_id = NEW.clan_id) >= 10 THEN
            RAISE EXCEPTION 'clan is full' USING ERRCODE = 'check_violation';
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
        """
    )
    op.execute(
        """
        CREATE TRIGGER clan_members_max_size
        BEFORE INSERT ON clan_members
        FOR EACH ROW EXECUTE FUNCTION enforce_clan_size()
        """
    )

    # Clan ground belongs to the clan, not to whoever walked it, so it stays
    # when a member leaves (TZ section 23.2). The runner is still recorded.
    op.execute(
        "ALTER TABLE territories ADD COLUMN owner_clan_id uuid "
        "REFERENCES clans(id) ON DELETE CASCADE"
    )
    op.execute(
        """
        ALTER TABLE territories ADD CONSTRAINT territories_owner_matches_mode_check
        CHECK (
          (mode = 'solo' AND owner_clan_id IS NULL)
          OR (mode = 'clan' AND owner_clan_id IS NOT NULL)
        )
        """
    )
    op.execute("CREATE INDEX idx_territories_mode_clan ON territories (mode, owner_clan_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_territories_mode_clan")
    op.execute(
        "ALTER TABLE territories DROP CONSTRAINT IF EXISTS territories_owner_matches_mode_check"
    )
    op.execute("ALTER TABLE territories DROP COLUMN IF EXISTS owner_clan_id")
    op.execute("DROP TRIGGER IF EXISTS clan_members_max_size ON clan_members")
    op.execute("DROP FUNCTION IF EXISTS enforce_clan_size")
    op.execute("DROP TABLE IF EXISTS clan_members")
    op.execute("DROP TABLE IF EXISTS clans")
    op.execute("DROP FUNCTION IF EXISTS next_invite_code")
    op.execute("DROP TRIGGER IF EXISTS demo_users_default_display_name ON demo_users")
    op.execute("DROP FUNCTION IF EXISTS default_display_name")
    op.execute("ALTER TABLE demo_users ALTER COLUMN display_name DROP DEFAULT")
    op.execute("ALTER TABLE demo_users DROP CONSTRAINT IF EXISTS demo_users_player_id_check")
    op.execute("DROP INDEX IF EXISTS idx_demo_users_player_id")
    op.execute("ALTER TABLE demo_users DROP COLUMN IF EXISTS player_id")
    op.execute("DROP FUNCTION IF EXISTS next_player_id")
