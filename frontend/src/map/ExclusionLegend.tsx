import { EXCLUSION_COLORS, EXCLUSION_KINDS, EXCLUSION_LABELS } from './exclusions';

interface ExclusionLegendProps {
  visible: boolean;
  onToggle: () => void;
  count: number;
  truncated: boolean;
}

/** Names the colours on the map, so the zone types can be told apart. */
export function ExclusionLegend({ visible, onToggle, count, truncated }: ExclusionLegendProps) {
  return (
    <aside className="legend" aria-label="Excluded ground">
      <div className="legend-head">
        <p className="eyebrow">Excluded ground</p>
        <button type="button" onClick={onToggle} aria-pressed={visible}>
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>

      {visible ? (
        <>
          <ul className="legend-list">
            {EXCLUSION_KINDS.map((kind) => (
              <li key={kind}>
                <span
                  className="legend-swatch"
                  style={{ background: EXCLUSION_COLORS[kind] }}
                  aria-hidden="true"
                />
                {EXCLUSION_LABELS[kind]}
              </li>
            ))}
          </ul>
          <p className="legend-note">
            {truncated
              ? 'Too many zones to draw here — zoom in to see them all.'
              : `${count} zone${count === 1 ? '' : 's'} in view. This ground is subtracted from a capture.`}
          </p>
        </>
      ) : null}
    </aside>
  );
}
