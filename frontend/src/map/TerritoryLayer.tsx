import { useCallback, useEffect, useRef, useState } from 'react';
import { Layer, Source, useMap } from 'react-map-gl/maplibre';
import { fetchTerritories } from '../run/api';
import { type Bbox, bboxKey, roundBbox } from './bbox';

/** Map movement settles before a request goes out. */
const DEBOUNCE_MS = 300;

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

interface TerritoryLayerProps {
  /** Changing this forces a refetch, e.g. after a run is accepted. */
  refreshKey?: string;
  mode?: string;
  onApiReachable?: (reachable: boolean) => void;
}

export function TerritoryLayer({
  refreshKey = '',
  mode = 'solo',
  onApiReachable,
}: TerritoryLayerProps) {
  const { current: map } = useMap();
  const [data, setData] = useState<GeoJSON.FeatureCollection>(EMPTY);
  const lastKey = useRef<string>('');
  const timer = useRef<number | null>(null);

  const load = useCallback(
    async (force: boolean) => {
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
      const key = `${bboxKey(bbox)}|${mode}`;

      if (!force && key === lastKey.current) {
        return;
      }
      lastKey.current = key;

      try {
        setData(await fetchTerritories(bbox, mode));
        onApiReachable?.(true);
      } catch {
        // A static deployment has no API; the map still has to render.
        onApiReachable?.(false);
      }
    },
    [map, mode, onApiReachable],
  );

  useEffect(() => {
    if (!map) {
      return;
    }

    const schedule = () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
      timer.current = window.setTimeout(() => void load(false), DEBOUNCE_MS);
    };

    void load(true);
    map.on('moveend', schedule);

    return () => {
      map.off('moveend', schedule);
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    };
  }, [map, load]);

  // A finished run changes the data without moving the map.
  useEffect(() => {
    if (refreshKey) {
      void load(true);
    }
  }, [refreshKey, load]);

  return (
    <Source id="territories" type="geojson" data={data}>
      <Layer
        id="territory-fill"
        type="fill"
        paint={{ 'fill-color': '#c7ff4a', 'fill-opacity': 0.28 }}
      />
      <Layer
        id="territory-outline"
        type="line"
        paint={{ 'line-color': '#7fb800', 'line-width': 2 }}
      />
    </Source>
  );
}
