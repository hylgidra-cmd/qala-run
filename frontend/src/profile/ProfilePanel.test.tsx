import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { t } from '../i18n/qq';
import { ProfilePanel } from './ProfilePanel';
import { avatarHue, initials } from './identity';
import type { Me } from './api';
import type { Profile } from './useProfile';

function me(overrides: Partial<Me> = {}): Me {
  return {
    user_id: 'u1',
    player_id: '84920155',
    display_name: 'Aydos Jumabaev',
    joined_at: '2026-09-19T10:00:00+00:00',
    stats: { runs_accepted: 7, solo_area_m2: 12400, clan_area_m2: 31000 },
    clan: null,
    ...overrides,
  };
}

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    me: me(),
    clan: null,
    available: true,
    reload: vi.fn().mockResolvedValue(undefined),
    rename: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    join: vi.fn().mockResolvedValue(undefined),
    leave: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('initials', () => {
  it('takes one letter from each of two words', () => {
    expect(initials('Aydos Jumabaev')).toBe('AJ');
  });

  it('takes the first two letters of a single word', () => {
    expect(initials('Gulnaz')).toBe('GU');
  });
});

describe('avatarHue', () => {
  it('is stable for a player id', () => {
    expect(avatarHue('84920155')).toBe(avatarHue('84920155'));
  });

  it('stays inside the colour wheel', () => {
    expect(avatarHue('99999999')).toBeGreaterThanOrEqual(0);
    expect(avatarHue('99999999')).toBeLessThan(360);
  });
});

describe('ProfilePanel', () => {
  it('shows the 8-digit player id', () => {
    render(<ProfilePanel profile={profile()} onClose={() => {}} />);

    expect(screen.getByText('84920155')).toBeVisible();
    expect(screen.getByText(t.profile.playerId)).toBeVisible();
  });

  it('shows the areas the server counted', () => {
    render(<ProfilePanel profile={profile()} onClose={() => {}} />);

    expect(screen.getByText('1.24 ha')).toBeVisible();
    expect(screen.getByText('3.10 ha')).toBeVisible();
    expect(screen.getByText('7')).toBeVisible();
  });

  it('renames the player', async () => {
    const state = profile();
    render(<ProfilePanel profile={state} onClose={() => {}} />);

    fireEvent.change(screen.getByDisplayValue('Aydos Jumabaev'), {
      target: { value: 'Aydos' },
    });
    fireEvent.click(screen.getByRole('button', { name: t.profile.save }));

    await waitFor(() => expect(state.rename).toHaveBeenCalledWith('Aydos'));
  });

  it('refuses a one-letter name without asking the server', async () => {
    const state = profile();
    render(<ProfilePanel profile={state} onClose={() => {}} />);

    fireEvent.change(screen.getByDisplayValue('Aydos Jumabaev'), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: t.profile.save }));

    expect(await screen.findByText(t.profile.nameTooShort)).toBeVisible();
    expect(state.rename).not.toHaveBeenCalled();
  });

  it('says so when no API is reachable', () => {
    render(<ProfilePanel profile={profile({ available: false, me: null })} onClose={() => {}} />);

    expect(screen.getByText(t.profile.unavailable)).toBeVisible();
  });

  it('closes on request', () => {
    const onClose = vi.fn();
    render(<ProfilePanel profile={profile()} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: t.profile.close }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
