import { t } from '../i18n/qq';
import { EXCLUSION_COLORS, EXCLUSION_KINDS } from './exclusions';

interface ExclusionLegendProps {
  visible: boolean;
  onToggle: () => void;
  count: number;
  truncated: boolean;
}

/** Names the colours on the map, so the zone types can be told apart. */
export function ExclusionLegend({ visible, onToggle, count, truncated }: ExclusionLegendProps) {
  return (
    <aside className="legend" aria-label={t.legend.title}>
      <div className="legend-head">
        <p className="eyebrow">{t.legend.title}</p>
        <button type="button" onClick={onToggle} aria-pressed={visible}>
          {visible ? t.legend.hide : t.legend.show}
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
                {t.legend.kinds[kind]}
              </li>
            ))}
          </ul>
          <p className="legend-note">
            {truncated ? t.legend.truncated : t.legend.count(count)}
          </p>
        </>
      ) : null}
    </aside>
  );
}
