import { useCallback, useEffect, useRef, useState } from 'react';
import { Layer, Source, useMap } from 'react-map-gl/maplibre';
import { type ExclusionCollection, fetchExclusions } from '../run/api';
import { type Bbox, bboxKey, roundBbox } from './bbox';
import { exclusionColorExpression } from './exclusions';

/** Map movement settles before a request goes out. */
const DEBOUNCE_MS = 300;

const EMPTY: ExclusionCollection = { type: 'FeatureCollection', features: [] };

interface ExclusionLayerProps {
  visible?: boolean;
  /** Called with the zone count, and whether the view was capped. */
  onLoaded?: (count: number, truncated: boolean) => void;
}

/**
 * Draws the ground a run never wins (TZ sections 9, 10 and 12). It sits below
 * the territory layers, so a captured polygon still reads on top of it.
 */
export function ExclusionLayer({ visible = true, onLoaded }: ExclusionLayerProps) {
  const { current: map } = useMap();
  const [data, setData] = useState<ExclusionCollection>(EMPTY);
  const lastKey = useRef<string>('');
  const timer = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!map) {
      return;
    }

    const bounds = map.getBounds();
    const bbox = roundBbox([
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ] as Bbox);
    const key = bboxKey(bbox);

    if (key === lastKey.current) {
      return;
    }
    lastKey.current = key;

    try {
      const collection = await fetchExclusions(bbox);
      setData(collection);
      onLoaded?.(collection.features.length, collection.truncated === true);
    } catch {
      // A static deployment has no API; the map still has to render.
      lastKey.current = '';
      setData(EMPTY);
      onLoaded?.(0, false);
    }
  }, [map, onLoaded]);

  useEffect(() => {
    if (!map || !visible) {
      return;
    }

    const schedule = () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
      timer.current = window.setTimeout(() => void load(), DEBOUNCE_MS);
    };

    void load();
    map.on('moveend', schedule);

    return () => {
      map.off('moveend', schedule);
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    };
  }, [map, visible, load]);

  return (
    <Source id="exclusions" type="geojson" data={visible ? data : EMPTY}>
      <Layer
        id="exclusion-fill"
        type="fill"
        paint={{
          'fill-color': exclusionColorExpression() as never,
          'fill-opacity': 0.45,
        }}
      />
      <Layer
        id="exclusion-outline"
        type="line"
        paint={{
          'line-color': exclusionColorExpression() as never,
          'line-width': 1,
          'line-opacity': 0.8,
        }}
      />
    </Source>
  );
}
