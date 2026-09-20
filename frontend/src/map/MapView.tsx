import { useMemo, useState } from 'react';
import Map, { GeolocateControl, Layer, NavigationControl, Source } from 'react-map-gl/maplibre';
import type { TrackPoint } from '../run/api';
import { TerritoryLayer } from './TerritoryLayer';
import { OUT_OF_BOUNDS_NOTICE, geolocationNotice, isInsidePilotBounds } from './geolocation';
import { DEV_MAP_STYLE, NUKUS_CENTER, PILOT_BOUNDS } from './style';

interface MapViewProps {
  /** Which of the two territory layers is on screen. */
  mode?: string;
  trackPoints?: TrackPoint[];
  territoryRefreshKey?: string;
  onApiReachable?: (reachable: boolean) => void;
}

export function MapView({
  mode = 'solo',
  trackPoints = [],
  territoryRefreshKey = '',
  onApiReachable,
}: MapViewProps) {
  const [notice, setNotice] = useState<string | null>(null);

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
      initialViewState={{ ...NUKUS_CENTER, zoom: 13 }}
      maxBounds={PILOT_BOUNDS}
      minZoom={10}
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

      <TerritoryLayer
        mode={mode}
        refreshKey={territoryRefreshKey}
        onApiReachable={onApiReachable}
      />

      <Source id="live-track" type="geojson" data={track}>
        <Layer
          id="live-track-line"
          type="line"
          paint={{ 'line-color': '#ff8a3d', 'line-width': 4, 'line-opacity': 0.9 }}
        />
      </Source>

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
