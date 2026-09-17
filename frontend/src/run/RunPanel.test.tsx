import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RunPanel } from './RunPanel';
import type { RunTracker } from './useRunTracker';

function tracker(overrides: Partial<RunTracker> = {}): RunTracker {
  return {
    phase: 'idle',
    runId: null,
    points: [],
    result: null,
    error: null,
    start: vi.fn(),
    finish: vi.fn(),
    reset: vi.fn(),
    recover: vi.fn(),
    ...overrides,
  };
}

describe('RunPanel', () => {
  it('offers to start when idle', () => {
    render(<RunPanel tracker={tracker()} apiReachable />);

    expect(screen.getByRole('button', { name: 'Start run' })).toBeEnabled();
  });

  it('switches to finishing the run while tracking', () => {
    render(<RunPanel tracker={tracker({ phase: 'tracking', points: [] })} apiReachable />);

    expect(screen.getByRole('button', { name: 'Finish run' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Start run' })).toBeNull();
  });

  it('counts the recorded points', () => {
    const points = [
      { lat: 1, lon: 1, ts: 1, accuracy: 5, speed: null, mocked: false },
      { lat: 1, lon: 1, ts: 2, accuracy: 5, speed: null, mocked: false },
    ];

    render(<RunPanel tracker={tracker({ phase: 'tracking', points })} apiReachable />);

    expect(screen.getByText(/2 points recorded/)).toBeVisible();
  });

  it('shows the awarded area the server decided', () => {
    const result = {
      run_id: 'r1',
      status: 'accepted' as const,
      reason: null,
      mode: 'solo',
      raw_area_m2: 14400,
      excluded_area_m2: 0,
      awarded_area_m2: 14400,
      territory_id: 't1',
      activity: { type: 'walk', confidence: 0.85, avg_speed_ms: 1.4 },
      captured_from: [],
      warnings: [],
    };

    render(<RunPanel tracker={tracker({ phase: 'done', result })} apiReachable />);

    expect(screen.getByText('1.44 ha')).toBeVisible();
    expect(screen.getByText(/TERRITORY CAPTURED/)).toBeVisible();
  });

  it('explains a rejection in words, not an enum', () => {
    const result = {
      run_id: 'r1',
      status: 'rejected' as const,
      reason: 'LOOP_NOT_CLOSED',
      mode: 'solo',
      raw_area_m2: null,
      excluded_area_m2: null,
      awarded_area_m2: null,
      territory_id: null,
      activity: null,
      captured_from: [],
      warnings: [],
    };

    render(<RunPanel tracker={tracker({ phase: 'done', result })} apiReachable />);

    expect(screen.getByText(/back to the start/i)).toBeVisible();
  });

  it('says why running is impossible without an API', () => {
    render(<RunPanel tracker={tracker()} apiReachable={false} />);

    expect(screen.getByText(/needs the backend/i)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Start run' })).toBeNull();
  });

  it('offers to release a run left active elsewhere', () => {
    const error = 'A run is already active: 123e4567-e89b-12d3-a456-426614174000.';

    render(<RunPanel tracker={tracker({ error })} apiReachable />);

    expect(screen.getByRole('button', { name: 'Release it' })).toBeVisible();
  });
});
