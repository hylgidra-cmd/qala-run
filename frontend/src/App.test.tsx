import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { t } from './i18n/qq';
import type { Clan, Me } from './profile/api';

// MapLibre needs a real canvas, so the map is stood in for by a marker that
// records which of the two layers the app asked for.
vi.mock('./map/MapView', () => ({
  MapView: ({ mode }: { mode?: string }) => <div data-testid="map" data-mode={mode} />,
}));

const fetchMe = vi.fn();
const fetchClan = vi.fn();

vi.mock('./profile/api', async () => {
  const actual = await vi.importActual<typeof import('./profile/api')>('./profile/api');

  return {
    ...actual,
    fetchMe: (...args: unknown[]) => fetchMe(...args),
    fetchClan: (...args: unknown[]) => fetchClan(...args),
  };
});

function me(clan: Me['clan'] = null): Me {
  return {
    user_id: 'u1',
    player_id: '84920155',
    display_name: 'Aydos',
    joined_at: '2026-09-19T10:00:00+00:00',
    stats: { runs_accepted: 0, solo_area_m2: 0, clan_area_m2: 0 },
    clan,
  };
}

const membership: Me['clan'] = {
  id: 'c1',
  name: 'Nókis juwırıwshıları',
  tag: 'NKS',
  color_hex: '#c7ff4a',
  role: 'owner',
  member_count: 1,
};

const clan: Clan = {
  ...membership,
  created_at: '2026-09-19T10:00:00+00:00',
  area_m2: 0,
  members: [],
  invite_code: 'K7M2QP',
};

afterEach(() => {
  fetchMe.mockReset();
  fetchClan.mockReset();
});

describe('territory mode', () => {
  it('starts on the solo map', async () => {
    fetchMe.mockResolvedValue(me());

    render(<App />);

    await waitFor(() => expect(screen.getByTestId('map')).toHaveAttribute('data-mode', 'solo'));
  });

  it('sends a clan member to the clan map', async () => {
    fetchMe.mockResolvedValue(me(membership));
    fetchClan.mockResolvedValue(clan);
    render(<App />);
    await waitFor(() => expect(fetchClan).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: t.mode.clan }));

    await waitFor(() => expect(screen.getByTestId('map')).toHaveAttribute('data-mode', 'clan'));
  });

  it('asks a player without a clan to get one, and stays on the solo map', async () => {
    fetchMe.mockResolvedValue(me());
    render(<App />);
    await waitFor(() => expect(fetchMe).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: t.mode.clan }));

    expect(await screen.findByText(t.mode.clanNeeded)).toBeVisible();
    expect(screen.getByTestId('map')).toHaveAttribute('data-mode', 'solo');
  });

  it('opens the profile with the 8-digit id', async () => {
    fetchMe.mockResolvedValue(me());
    render(<App />);
    await waitFor(() => expect(fetchMe).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: t.profile.open }));

    expect(await screen.findByText('84920155')).toBeVisible();
  });

  it('speaks Karakalpak on the first screen', async () => {
    fetchMe.mockResolvedValue(me());

    render(<App />);

    expect(screen.getByText(t.map.headline)).toBeVisible();
    expect(screen.getByText(t.map.lead)).toBeVisible();
    await waitFor(() => expect(fetchMe).toHaveBeenCalled());
  });
});
