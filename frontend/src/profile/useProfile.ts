import { useCallback, useEffect, useState } from 'react';
import { t } from '../i18n/qq';
import { ApiError } from '../run/api';
import {
  type Clan,
  type Me,
  createClan as createClanRequest,
  fetchClan,
  fetchMe,
  joinClan as joinClanRequest,
  leaveClan as leaveClanRequest,
  removeMember as removeMemberRequest,
  renameMe,
  updateMe,
} from './api';

/**
 * Turn a server refusal into something a player can read.
 *
 * The server answers in English because its messages are a developer-facing
 * contract; the site only ever speaks Karakalpak.
 */
export function clanErrorText(cause: unknown): string {
  if (!(cause instanceof ApiError)) {
    return t.clan.errors.generic;
  }

  const message = cause.message.toLowerCase();

  if (cause.status === 409 && message.includes('already in a clan')) {
    return t.clan.errors.alreadyInClan;
  }
  if (cause.status === 409 && message.includes('tag')) {
    return t.clan.errors.tagTaken;
  }
  if (cause.status === 409 && message.includes('full')) {
    return t.clan.errors.full;
  }
  if (cause.status === 404) {
    return t.clan.errors.codeNotFound;
  }
  if (cause.status === 422) {
    return t.clan.errors.invalid;
  }

  return t.clan.errors.generic;
}

export interface Profile {
  me: Me | null;
  clan: Clan | null;
  /** False when no backend is reachable, e.g. on a static deployment. */
  available: boolean;
  reload: () => Promise<void>;
  rename: (displayName: string) => Promise<void>;
  updateProfile: (input: {
    displayName?: string;
    colorHex?: string;
    city?: string;
    avatarData?: string | null;
  }) => Promise<void>;
  create: (input: { name: string; tag: string; color_hex: string }) => Promise<void>;
  join: (inviteCode: string) => Promise<void>;
  leave: () => Promise<void>;
  remove: (memberId: string) => Promise<void>;
}

/**
 * The player's own profile and clan, loaded once and kept fresh after every
 * change. Errors are raised to the caller so a form can show them in place.
 */
export function useProfile(): Profile {
  const [me, setMe] = useState<Me | null>(null);
  const [clan, setClan] = useState<Clan | null>(null);
  const [available, setAvailable] = useState(true);

  const reload = useCallback(async () => {
    try {
      const loaded = await fetchMe();
      setMe(loaded);
      setClan(loaded.clan ? await fetchClan(loaded.clan.id) : null);
      setAvailable(true);
    } catch {
      setAvailable(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const rename = useCallback(async (displayName: string) => {
    setMe(await renameMe(displayName));
  }, []);

  const updateProfile = useCallback(
    async (input: {
      displayName?: string;
      colorHex?: string;
      city?: string;
      avatarData?: string | null;
    }) => {
      const updated = await updateMe({
        display_name: input.displayName,
        color_hex: input.colorHex,
        city: input.city,
        avatar_data: input.avatarData,
      });
      setMe(updated);
    },
    [],
  );

  const create = useCallback(
    async (input: { name: string; tag: string; color_hex: string }) => {
      setClan(await createClanRequest(input));
      setMe(await fetchMe());
    },
    [],
  );

  const join = useCallback(async (inviteCode: string) => {
    setClan(await joinClanRequest(inviteCode));
    setMe(await fetchMe());
  }, []);

  const leave = useCallback(async () => {
    if (!clan) {
      return;
    }

    await leaveClanRequest(clan.id);
    setClan(null);
    setMe(await fetchMe());
  }, [clan]);

  const remove = useCallback(
    async (memberId: string) => {
      if (!clan) {
        return;
      }

      await removeMemberRequest(clan.id, memberId);
      setClan(await fetchClan(clan.id));
    },
    [clan],
  );

  return { me, clan, available, reload, rename, updateProfile, create, join, leave, remove };
}
