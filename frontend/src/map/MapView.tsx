import { useCallback, useMemo, useState } from 'react';
import Map, { GeolocateControl, Layer, NavigationControl, Source } from 'react-map-gl/maplibre';
import type { TrackPoint } from '../run/api';
import { ExclusionLayer } from './ExclusionLayer';
import { ExclusionLegend } from './ExclusionLegend';
import { TerritoryLayer } from './TerritoryLayer';
import { OUT_OF_BOUNDS_NOTICE, geolocationNotice, isInsidePilotBounds } from './geolocation';
import { DEV_MAP_STYLE, NUKUS_CENTER, PILOT_BOUNDS } from './style';

interface MapViewProps {
  trackPoints?: TrackPoint[];
  territoryRefreshKey?: string;
  onApiReachable?: (reachable: boolean) => void;
}

export function MapView({
  trackPoints = [],
  territoryRefreshKey = '',
  onApiReachable,
}: MapViewProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const [showExclusions, setShowExclusions] = useState(true);
  const [zones, setZones] = useState({ count: 0, truncated: false });
  const handleZonesLoaded = useCallback(
    (count: number, truncated: boolean) => setZones({ count, truncated }),
    [],
  );

  const track = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features:
        trackPoints.length > 1
          ? [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: trackPoints.map((point) => [point.lon, point.lat]),
                },
              },
            ]
          : [],
    }),
    [trackPoints],
  );

  return (
    <Map
      mapStyle={DEV_MAP_STYLE}
      initialViewState={{ ...NUKUS_CENTER, zoom: 14 }}
      maxBounds={PILOT_BOUNDS}
      minZoom={12}
      maxZoom={19}
      style={{ width: '100%', height: '100%' }}
    >
      <NavigationControl position="top-right" />
      <GeolocateControl
        position="top-right"
        trackUserLocation
        showUserLocation
        positionOptions={{ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }}
        onGeolocate={(event) => {
          const { longitude, latitude } = event.coords;
          setNotice(isInsidePilotBounds(longitude, latitude) ? null : OUT_OF_BOUNDS_NOTICE);
        }}
        onError={(error) => setNotice(geolocationNotice(error.code))}
        onOutOfMaxBounds={() => setNotice(OUT_OF_BOUNDS_NOTICE)}
      />

      <ExclusionLayer visible={showExclusions} onLoaded={handleZonesLoaded} />

      <TerritoryLayer refreshKey={territoryRefreshKey} onApiReachable={onApiReachable} />

      <Source id="live-track" type="geojson" data={track}>
        <Layer
          id="live-track-line"
          type="line"
          paint={{ 'line-color': '#ff8a3d', 'line-width': 4, 'line-opacity': 0.9 }}
        />
      </Source>

      <ExclusionLegend
        visible={showExclusions}
        onToggle={() => setShowExclusions((shown) => !shown)}
        count={zones.count}
        truncated={zones.truncated}
      />

      {notice ? (
        <div className="map-notice" role="status">
          <p>{notice}</p>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">
            Dismiss
          </button>
        </div>
      ) : null}
    </Map>
  );
}
