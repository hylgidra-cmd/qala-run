import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, type MapRef, NavigationControl, Popup, Source } from 'react-map-gl/maplibre';
import { type LiveRunner, fetchLiveRunners } from '../admin/api';
import type { TrackPoint } from '../run/api';
import { formatArea } from '../run/format';
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

interface SelectedTerritory {
  longitude: number;
  latitude: number;
  ownerName: string;
  ownerTag?: string | null;
  ownerPlayerId?: string | null;
  areaM2: number;
  color: string;
  createdAt: string;
  mode: string;
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
  const [locating, setLocating] = useState(false);
  const [otherRunners, setOtherRunners] = useState<LiveRunner[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<SelectedTerritory | null>(null);
  const mapRef = useRef<MapRef | null>(null);
  const city = getCity(cityId);

  const handleQuickLocate = () => {
    // If active tracking points exist, center on the most recent point
    if (trackPoints && trackPoints.length > 0) {
      const latest = trackPoints[trackPoints.length - 1];
      mapRef.current?.flyTo({
        center: [latest.lon, latest.lat],
        zoom: 16,
        essential: true,
      });
      return;
    }

    if (!navigator.geolocation) {
      setNotice('GPS brauzerińizde qollap-quwatlanbaydı');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { longitude, latitude } = pos.coords;
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 16,
          essential: true,
        });
        const inside = isInsideCityBounds(longitude, latitude, city.id);
        if (!inside) {
          setNotice(outOfCityNotice(city.id));
        }
      },
      (err) => {
        setLocating(false);
        setNotice(geolocationNotice(err.code));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  };

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

  const handleMapClick = (event: any) => {
    const features = event.features;
    if (features && features.length > 0) {
      const terrFeature = features.find((f: any) => f.layer.id === 'territory-fill');
      if (terrFeature && terrFeature.properties) {
        const p = terrFeature.properties;
        setSelectedTerritory({
          longitude: event.lngLat.lng,
          latitude: event.lngLat.lat,
          ownerName: p.owner_name || 'Belgisiz',
          ownerTag: p.owner_tag,
          ownerPlayerId: p.owner_player_id,
          areaM2: Number(p.area_m2 || 0),
          color: p.color || '#00ff88',
          createdAt: p.created_at,
          mode: p.mode || 'solo',
        });
        return;
      }
    }
    // Clicked outside territory
    setSelectedTerritory(null);
  };

  return (
    <Map
      ref={mapRef}
      mapStyle={DEV_MAP_STYLE}
      initialViewState={{ longitude: city.center.longitude, latitude: city.center.latitude, zoom: city.zoom }}
      maxBounds={city.bounds}
      minZoom={10}
      maxZoom={19}
      interactiveLayerIds={['territory-fill']}
      onClick={handleMapClick}
      style={{ width: '100%', height: '100%' }}
    >
      <NavigationControl position="top-right" />

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

      {/* Selected Territory Info Popup */}
      {selectedTerritory && (
        <Popup
          longitude={selectedTerritory.longitude}
          latitude={selectedTerritory.latitude}
          anchor="top"
          onClose={() => setSelectedTerritory(null)}
          closeButton={true}
          closeOnClick={false}
          className="territory-popup-wrapper"
        >
          <div className="territory-popup-content">
            <div className="popup-badge" style={{ background: `${selectedTerritory.color}22`, color: selectedTerritory.color, borderColor: selectedTerritory.color }}>
              {selectedTerritory.mode === 'clan' ? '🛡️ KLAN AYMAǴI' : '🏃 JEKE AYMAQ'}
            </div>
            <h3 className="popup-owner" style={{ color: selectedTerritory.color }}>
              {selectedTerritory.ownerTag ? `[${selectedTerritory.ownerTag}] ` : ''}
              {selectedTerritory.ownerName}
            </h3>
            {selectedTerritory.ownerPlayerId && (
              <p className="popup-player-id">ID: <strong>{selectedTerritory.ownerPlayerId}</strong></p>
            )}
            <div className="popup-metric">
              <span className="p-label">Iyelengen maydan:</span>
              <strong className="p-val">{formatArea(selectedTerritory.areaM2)}</strong>
            </div>
          </div>
        </Popup>
      )}

      {/* Other active players/runners on the map */}
      {otherRunners.map((r) => {
        if (!r.location) return null;
        const color = r.color || '#00D995';
        return (
          <Marker
            key={`runner-${r.user_id}`}
            longitude={r.location.lon}
            latitude={r.location.lat}
            anchor="center"
          >
            <div
              className={`map-runner-pin ${r.status === 'running' ? 'is-running' : ''}`}
              title={`${r.display_name} (${r.status === 'running' ? 'Juwırmaqta 🏃' : 'Onlayn'})`}
            >
              <div
                className="runner-pin-dot"
                style={{ backgroundColor: color }}
              >
                {r.status === 'running' && (
                  <span className="runner-pin-pulse" style={{ borderColor: color }} />
                )}
              </div>
              <span
                className="runner-pin-label"
                style={{ borderColor: `${color}44` }}
              >
                {r.display_name}
              </span>
            </div>
          </Marker>
        );
      })}

      {/* Floating GPS / Geolocation center button */}
      <button
        type="button"
        className={`map-floating-geo-btn ${locating ? 'locating' : ''}`}
        onClick={handleQuickLocate}
        title="Mening jaylasqan ornım (GPS)"
        aria-label="Mening jaylasqan ornım (GPS)"
      >
        <span className="geo-icon" aria-hidden="true">
          {locating ? '📡' : '🎯'}
        </span>
      </button>

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

