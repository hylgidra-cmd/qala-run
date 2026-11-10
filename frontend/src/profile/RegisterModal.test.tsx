import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RegisterModal } from './RegisterModal';
import type { Profile } from './useProfile';

function mockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    me: {
      user_id: 'u1',
      player_id: '84920155',
      display_name: 'Oyınshı 84920155',
      color_hex: '#00ff88',
      joined_at: '2026-09-19T10:00:00Z',
      stats: { runs_accepted: 0, solo_area_m2: 0, clan_area_m2: 0 },
      clan: null,
    },
    clan: null,
    available: true,
    reload: vi.fn(),
    rename: vi.fn(),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    create: vi.fn(),
    join: vi.fn(),
    leave: vi.fn(),
    remove: vi.fn(),
    ...overrides,
  };
}

describe('RegisterModal', () => {
  it('renders player id and welcome header', () => {
    const profile = mockProfile();
    render(<RegisterModal profile={profile} onComplete={vi.fn()} />);

    expect(screen.getByText('Qala Run-ǵa xosh keldińiz!')).toBeVisible();
    expect(screen.getByText('84920155')).toBeVisible();
  });

  it('allows entering a name, a Gmail address, picking a color and submitting', async () => {
    const profile = mockProfile();
    const onComplete = vi.fn();
    render(<RegisterModal profile={profile} onComplete={onComplete} />);

    const input = screen.getByPlaceholderText('Atıńızdı kiritiń (mısaly: Madiyar)');
    fireEvent.change(input, { target: { value: 'Madiyar' } });

    const emailInput = screen.getByPlaceholderText('Gmail kiritiń (mısaly: madiyar@gmail.com)');
    fireEvent.change(emailInput, { target: { value: 'madiyar@gmail.com' } });

    // Pick a different color
    const cyanPill = screen.getByRole('button', { name: 'Color #00e5ff' });
    fireEvent.click(cyanPill);

    const submitBtn = screen.getByRole('button', { name: /Dizimnen ótiw & Baslaw/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(profile.updateProfile).toHaveBeenCalledWith({
        displayName: 'Madiyar',
        email: 'madiyar@gmail.com',
        colorHex: '#00e5ff',
      });
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('rejects non-Gmail email addresses', async () => {
    const profile = mockProfile();
    render(<RegisterModal profile={profile} onComplete={vi.fn()} />);

    const input = screen.getByPlaceholderText('Atıńızdı kiritiń (mısaly: Madiyar)');
    fireEvent.change(input, { target: { value: 'Madiyar' } });

    const emailInput = screen.getByPlaceholderText('Gmail kiritiń (mısaly: madiyar@gmail.com)');
    fireEvent.change(emailInput, { target: { value: 'madiyar@mail.ru' } });

    const submitBtn = screen.getByRole('button', { name: /Dizimnen ótiw & Baslaw/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Faqat @gmail\.com/i)).toBeVisible();
    expect(profile.updateProfile).not.toHaveBeenCalled();
  });

  it('rejects names shorter than 2 characters', async () => {
    const profile = mockProfile();
    render(<RegisterModal profile={profile} onComplete={vi.fn()} />);

    const input = screen.getByPlaceholderText('Atıńızdı kiritiń (mısaly: Madiyar)');
    fireEvent.change(input, { target: { value: 'A' } });

    const emailInput = screen.getByPlaceholderText('Gmail kiritiń (mısaly: madiyar@gmail.com)');
    fireEvent.change(emailInput, { target: { value: 'madiyar@gmail.com' } });

    const submitBtn = screen.getByRole('button', { name: /Dizimnen ótiw & Baslaw/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/keminde 2 belgiden/i)).toBeVisible();
    expect(profile.updateProfile).not.toHaveBeenCalled();
  });
});


