import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExclusionLegend } from './ExclusionLegend';
import { t } from '../i18n/qq';
import { EXCLUSION_KINDS } from './exclusions';

describe('ExclusionLegend', () => {
  it('names every zone kind while the layer is shown', () => {
    render(<ExclusionLegend visible onToggle={() => {}} count={12} truncated={false} />);

    for (const kind of EXCLUSION_KINDS) {
      expect(screen.getByText(t.legend.kinds[kind])).toBeInTheDocument();
    }
    expect(screen.getByText(t.legend.count(12))).toBeInTheDocument();
  });

  it('says to zoom in when the server capped the view', () => {
    render(<ExclusionLegend visible onToggle={() => {}} count={3000} truncated />);

    expect(screen.getByText(t.legend.truncated)).toBeInTheDocument();
  });

  it('collapses to the toggle when the layer is hidden', () => {
    render(<ExclusionLegend visible={false} onToggle={() => {}} count={12} truncated={false} />);

    expect(screen.queryByText(t.legend.kinds.water)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.legend.show })).toBeInTheDocument();
  });

  it('reports a toggle', () => {
    const onToggle = vi.fn();
    render(<ExclusionLegend visible onToggle={onToggle} count={0} truncated={false} />);

    fireEvent.click(screen.getByRole('button', { name: t.legend.hide }));

    expect(onToggle).toHaveBeenCalledOnce();
  });
});
