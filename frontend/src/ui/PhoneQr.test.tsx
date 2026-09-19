import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { t } from '../i18n/qq';
import { PhoneQr } from './PhoneQr';

describe('PhoneQr', () => {
  it('renders a scannable code for a reachable host', async () => {
    render(<PhoneQr href="https://dontstop-web.onrender.com/" />);

    expect(await screen.findByRole('img', { name: /dontstop-web\.onrender\.com/ })).toBeVisible();
    expect(screen.getByText('https://dontstop-web.onrender.com/')).toBeVisible();
  });

  it('explains why localhost has no code instead of showing a dead one', () => {
    render(<PhoneQr href="http://localhost:5173/" />);

    expect(screen.getByText(t.qr.localhost)).toBeVisible();
    expect(screen.queryByRole('img')).toBeNull();
  });
});
