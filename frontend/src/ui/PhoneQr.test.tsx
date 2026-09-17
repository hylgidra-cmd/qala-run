import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PhoneQr } from './PhoneQr';

describe('PhoneQr', () => {
  it('renders a scannable code for a reachable host', async () => {
    render(<PhoneQr href="https://qalarun-web.onrender.com/" />);

    expect(await screen.findByRole('img', { name: /qalarun-web\.onrender\.com/ })).toBeVisible();
    expect(screen.getByText('https://qalarun-web.onrender.com/')).toBeVisible();
  });

  it('explains why localhost has no code instead of showing a dead one', () => {
    render(<PhoneQr href="http://localhost:5173/" />);

    expect(screen.getByText(/cannot open/i)).toBeVisible();
    expect(screen.queryByRole('img')).toBeNull();
  });
});
