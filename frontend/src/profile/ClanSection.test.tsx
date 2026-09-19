import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { t } from '../i18n/qq';
import { ApiError } from '../run/api';
import { ClanSection } from './ClanSection';
import type { Clan } from './api';
import { type Profile, clanErrorText } from './useProfile';

function clan(overrides: Partial<Clan> = {}): Clan {
  return {
    id: 'c1',
    name: 'Nókis juwırıwshıları',
    tag: 'NKS',
    color_hex: '#c7ff4a',
    created_at: '2026-09-19T10:00:00+00:00',
    member_count: 2,
    area_m2: 31000,
    members: [
      {
        user_id: 'u1',
        player_id: '84920155',
        display_name: 'Aydos',
        role: 'owner',
        joined_at: '2026-09-19T10:00:00+00:00',
      },
      {
        user_id: 'u2',
        player_id: '10293847',
        display_name: 'Gulnaz',
        role: 'member',
        joined_at: '2026-09-19T11:00:00+00:00',
      },
    ],
    invite_code: 'K7M2QP',
    ...overrides,
  };
}

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    me: null,
    clan: null,
    available: true,
    reload: vi.fn().mockResolvedValue(undefined),
    rename: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    join: vi.fn().mockResolvedValue(undefined),
    leave: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('clanErrorText', () => {
  it('explains a clan that is already full', () => {
    expect(clanErrorText(new ApiError(409, 'Clan is full'))).toBe(t.clan.errors.full);
  });

  it('explains a taken tag', () => {
    expect(clanErrorText(new ApiError(409, 'That tag is taken'))).toBe(t.clan.errors.tagTaken);
  });

  it('explains a code that matches nothing', () => {
    expect(clanErrorText(new ApiError(404, 'No clan with that invite code'))).toBe(
      t.clan.errors.codeNotFound,
    );
  });

  it('never leaks the server wording', () => {
    expect(clanErrorText(new Error('boom'))).toBe(t.clan.errors.generic);
  });
});

describe('ClanSection without a clan', () => {
  it('offers both joining and creating', () => {
    render(<ClanSection profile={profile()} />);

    expect(screen.getByText(t.clan.none)).toBeVisible();
    expect(screen.getByRole('button', { name: t.clan.join })).toBeVisible();
    expect(screen.getByRole('button', { name: t.clan.create })).toBeVisible();
  });

  it('explains why the panel opened when Clan was pressed', () => {
    render(<ClanSection profile={profile()} prompt />);

    expect(screen.getByText(t.mode.clanNeeded)).toBeVisible();
  });

  it('joins with a six-character code', async () => {
    const state = profile();
    render(<ClanSection profile={state} />);

    fireEvent.change(screen.getByLabelText(t.clan.codeField), { target: { value: 'k7m2qp' } });
    fireEvent.click(screen.getByRole('button', { name: t.clan.join }));

    await waitFor(() => expect(state.join).toHaveBeenCalledWith('K7M2QP'));
  });

  it('keeps joining disabled until the code is complete', () => {
    render(<ClanSection profile={profile()} />);

    fireEvent.change(screen.getByLabelText(t.clan.codeField), { target: { value: 'K7M' } });

    expect(screen.getByRole('button', { name: t.clan.join })).toBeDisabled();
  });

  it('creates a clan with a tag the server will accept', async () => {
    const state = profile();
    render(<ClanSection profile={state} />);

    fireEvent.change(screen.getByLabelText(t.clan.nameField), {
      target: { value: 'Nókis juwırıwshıları' },
    });
    fireEvent.change(screen.getByLabelText(t.clan.tagField), { target: { value: 'nks!' } });
    fireEvent.click(screen.getByRole('button', { name: t.clan.create }));

    await waitFor(() =>
      expect(state.create).toHaveBeenCalledWith({
        name: 'Nókis juwırıwshıları',
        tag: 'NKS',
        color_hex: '#c7ff4a',
      }),
    );
  });

  it('shows a refusal in Karakalpak', async () => {
    const state = profile({
      join: vi.fn().mockRejectedValue(new ApiError(409, 'Clan is full')),
    });
    render(<ClanSection profile={state} />);

    fireEvent.change(screen.getByLabelText(t.clan.codeField), { target: { value: 'K7M2QP' } });
    fireEvent.click(screen.getByRole('button', { name: t.clan.join }));

    expect(await screen.findByText(t.clan.errors.full)).toBeVisible();
  });
});

describe('ClanSection with a clan', () => {
  it('shows the roster, the code and the clan area', () => {
    render(<ClanSection profile={profile({ clan: clan() })} />);

    expect(screen.getByText('Nókis juwırıwshıları')).toBeVisible();
    expect(screen.getByText('K7M2QP')).toBeVisible();
    expect(screen.getByText('Aydos')).toBeVisible();
    expect(screen.getByText('84920155')).toBeVisible();
    expect(screen.getByText(t.clan.roles.owner)).toBeVisible();
    expect(screen.getByText(new RegExp(t.clan.members(2)))).toBeVisible();
  });

  it('hides the code from someone the server did not give it to', () => {
    render(<ClanSection profile={profile({ clan: clan({ invite_code: null }) })} />);

    expect(screen.queryByText(t.clan.inviteCode)).toBeNull();
  });

  it('leaves the clan', async () => {
    const state = profile({ clan: clan() });
    render(<ClanSection profile={state} />);

    fireEvent.click(screen.getByRole('button', { name: t.clan.leave }));

    await waitFor(() => expect(state.leave).toHaveBeenCalledOnce());
  });
});
