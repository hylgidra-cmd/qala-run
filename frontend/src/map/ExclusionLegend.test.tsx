import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExclusionLegend } from './ExclusionLegend';
import { EXCLUSION_KINDS, EXCLUSION_LABELS } from './exclusions';

describe('ExclusionLegend', () => {
  it('names every zone kind while the layer is shown', () => {
    render(<ExclusionLegend visible onToggle={() => {}} count={12} truncated={false} />);

    for (const kind of EXCLUSION_KINDS) {
      expect(screen.getByText(EXCLUSION_LABELS[kind])).toBeInTheDocument();
    }
    expect(screen.getByText(/12 zones in view/)).toBeInTheDocument();
  });

  it('says to zoom in when the server capped the view', () => {
    render(<ExclusionLegend visible onToggle={() => {}} count={3000} truncated />);

    expect(screen.getByText(/zoom in/i)).toBeInTheDocument();
  });

  it('collapses to the toggle when the layer is hidden', () => {
    render(<ExclusionLegend visible={false} onToggle={() => {}} count={12} truncated={false} />);

    expect(screen.queryByText(EXCLUSION_LABELS.water)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show' })).toBeInTheDocument();
  });

  it('reports a toggle', () => {
    const onToggle = vi.fn();
    render(<ExclusionLegend visible onToggle={onToggle} count={0} truncated={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Hide' }));

    expect(onToggle).toHaveBeenCalledOnce();
  });
});
