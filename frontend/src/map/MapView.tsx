import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { GeolocateControl, Layer, Marker, type MapRef, NavigationControl, Source } from 'react-map-gl/maplibre';
import { type LiveRunner, fetchLiveRunners } from '../admin/api';
import type { TrackPoint } from '../run/api';
import { TerritoryLayer } from './TerritoryLayer';
import { getCity } from './cities';
import { geolocationNotice, isInsideCityBounds, outOfCityNotice } from './geolocation';
import { DEV_MAP_STYLE } from './style';

interface MapViewProps {
  /** Active city identifier (nukus, tashkent, almaty, istanbul). */
  cityId?: string;
  /** Current logged in user ID so we don't render a duplicate marker over self */
  currentUserId?: string;
  /** Which of the two territory layers is on screen. */
  mode?: string;
  trackPoints?: TrackPoint[];
  territoryRefreshKey?: string;
  onApiReachable?: (reachable: boolean) => void;
}


export function MapView({
  cityId = 'nukus',
  currentUserId,
  mode = 'solo',
  trackPoints = [],
  territoryRefreshKey = '',
  onApiReachable,
}: MapViewProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const [otherRunners, setOtherRunners] = useState<LiveRunner[]>([]);
  const mapRef = useRef<MapRef | null>(null);
  const city = getCity(cityId);

  // Poll active runners to show other players on the map
  useEffect(() => {
    let active = true;
    const fetchOthers = async () => {
      try {
        const list = await fetchLiveRunners();
        if (active) {
          setOtherRunners(list.filter((r) => r.user_id !== currentUserId && r.location !== null));
        }
      } catch {
        // Backend warming up or unreachable
      }
    };

    void fetchOthers();
    const interval = window.setInterval(fetchOthers, 4000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [currentUserId]);

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

      {/* Other active players/runners on the map */}
      {otherRunners.map((r) => {
        if (!r.location) return null;
        const color = r.color || '#00ff88';
        return (
          <Marker
            key={`runner-${r.user_id}`}
            longitude={r.location.lon}
            latitude={r.location.lat}
            anchor="bottom"
          >
            <div
              className={`admin-marker ${r.status === 'running' ? 'running' : ''}`}
              style={{
                borderColor: color,
                boxShadow: `0 0 10px ${color}88`,
                transform: 'scale(0.85)',
              }}
              title={`${r.display_name} (${r.status === 'running' ? 'Juwırmaqta 🏃' : 'Onlayn'})`}
            >
              <span className="marker-pin">{r.status === 'running' ? '🏃' : '📍'}</span>
              <span
                className="marker-label"
                style={{
                  color: color,
                  fontSize: '0.68rem',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: '#07130f',
                  border: `1px solid ${color}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {r.display_name}
              </span>
            </div>
          </Marker>
        );
      })}

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
