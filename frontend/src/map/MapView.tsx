import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { GeolocateControl, Layer, type MapRef, NavigationControl, Source } from 'react-map-gl/maplibre';
import type { TrackPoint } from '../run/api';
import { TerritoryLayer } from './TerritoryLayer';
import { getCity } from './cities';
import { geolocationNotice, isInsideCityBounds, outOfCityNotice } from './geolocation';
import { DEV_MAP_STYLE } from './style';

interface MapViewProps {
  /** Active city identifier (nukus, tashkent, almaty, istanbul). */
  cityId?: string;
  /** Which of the two territory layers is on screen. */
  mode?: string;
  trackPoints?: TrackPoint[];
  territoryRefreshKey?: string;
  onApiReachable?: (reachable: boolean) => void;
}

export function MapView({
  cityId = 'nukus',
  mode = 'solo',
  trackPoints = [],
  territoryRefreshKey = '',
  onApiReachable,
}: MapViewProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const mapRef = useRef<MapRef | null>(null);
  const city = getCity(cityId);

  // Smoothly fly to the chosen city when switched
  useEffect(() => {
    mapRef.current?.flyTo({
      center: [city.center.longitude, city.center.latitude],
      zoom: city.zoom,
      essential: true,
    });
  }, [city]);

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
      ref={mapRef}
      mapStyle={DEV_MAP_STYLE}
      initialViewState={{ longitude: city.center.longitude, latitude: city.center.latitude, zoom: city.zoom }}
      maxBounds={city.bounds}
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
          const inside = isInsideCityBounds(longitude, latitude, city.id);
          setNotice(inside ? null : outOfCityNotice(city.id));
        }}
        onError={(error) => setNotice(geolocationNotice(error.code))}
        onOutOfMaxBounds={() => setNotice(outOfCityNotice(city.id))}
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
            ×
          </button>
        </div>
      ) : null}
    </Map>
  );
}
