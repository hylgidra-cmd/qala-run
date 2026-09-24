import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, type MapRef, NavigationControl, Popup, Source } from 'react-map-gl/maplibre';
import { Check, Clock, Crosshair, Flame, Loader2, Moon, Shield, Sun, User, UserPlus, X } from 'lucide-react';
import { type LiveRunner, fetchLiveRunners } from '../admin/api';
import { type TrackPoint, getTerritoryDecayInfo } from '../run/api';
import { formatArea } from '../run/format';
import { t } from '../i18n/qq';
import { TerritoryLayer } from './TerritoryLayer';
import { getCity } from './cities';
import { geolocationNotice, isInsideCityBounds, outOfCityNotice } from './geolocation';
import { MAP_STYLES, type MapTheme } from './style';

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
  theme?: MapTheme;
  onToggleTheme?: () => void;
  onSendFriendRequest?: (runner: LiveRunner) => void;
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
  theme = 'day',
  onToggleTheme,
  onSendFriendRequest,
}: MapViewProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [otherRunners, setOtherRunners] = useState<LiveRunner[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<SelectedTerritory | null>(null);
  const [selectedRunner, setSelectedRunner] = useState<LiveRunner | null>(null);
  const [sentFriendRequests, setSentFriendRequests] = useState<Record<string, boolean>>({});
  const mapRef = useRef<MapRef | null>(null);
  const city = getCity(cityId);

  const activeMapStyle = theme === 'night' ? MAP_STYLES.night : MAP_STYLES.day;

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
        if (!isInsideCityBounds(longitude, latitude, cityId)) {
          setNotice(outOfCityNotice(cityId));
          return;
        }

        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 16,
          essential: true,
        });
      },
      (err) => {
        setLocating(false);
        setNotice(geolocationNotice(err.code));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Poll live runners
  useEffect(() => {
    let timer: number | null = null;
    let active = true;

    const poll = async () => {
      try {
        const list = await fetchLiveRunners();
        if (active) {
          setOtherRunners(list.filter((r) => r.user_id !== currentUserId));
          onApiReachable?.(true);
        }
      } catch {
        if (active) {
          onApiReachable?.(false);
        }
      } finally {
        if (active) {
          timer = window.setTimeout(poll, 10000);
        }
      }
    };

    void poll();
    return () => {
      active = false;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [currentUserId, onApiReachable]);

  // Transform trackPoints into a GeoJSON Feature
  const track = useMemo(() => {
    const coordinates = (trackPoints ?? []).map((p) => [p.lon, p.lat]);
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates,
      },
      properties: {},
    };
  }, [trackPoints]);

  const handleMapClick = (e: any) => {
    // Look for territory fill click
    const feature = e.features && e.features[0];
    if (feature && feature.layer?.id === 'territory-fill') {
      const props = feature.properties;
      setSelectedTerritory({
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
        ownerName: props.owner_name || 'Noma\'lum',
        ownerTag: props.owner_tag,
        ownerPlayerId: props.owner_player_id || props.user_id,
        areaM2: Number(props.area_m2) || 0,
        color: props.color || '#21D8A0',
        createdAt: props.created_at || '',
        mode: props.mode || 'solo',
      });
      setSelectedRunner(null);
    } else {
      setSelectedTerritory(null);
    }
  };

  const handleFriendRequest = (runner: LiveRunner) => {
    setSentFriendRequests((prev) => ({ ...prev, [runner.user_id]: true }));
    onSendFriendRequest?.(runner);
  };

  // Construct closed loop polygon preview when user has >= 3 track points
  const loopPreviewPolygon = useMemo(() => {
    const rawCoords = (trackPoints ?? []).map((p) => [p.lon, p.lat]);
    if (rawCoords.length < 3) return null;
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[...rawCoords, rawCoords[0]]],
      },
      properties: {},
    };
  }, [trackPoints]);

  // Construct closing dashed line connecting current position back to starting point
  const loopClosingLine = useMemo(() => {
    const rawCoords = (trackPoints ?? []).map((p) => [p.lon, p.lat]);
    if (rawCoords.length < 3) return null;
    const first = rawCoords[0];
    const last = rawCoords[rawCoords.length - 1];
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: [last, first],
      },
      properties: {},
    };
  }, [trackPoints]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Map
        ref={mapRef}
        mapStyle={activeMapStyle}
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

        {/* Closed Loop Polygon Preview (INTVL Style Fill) */}
        {loopPreviewPolygon && (
          <Source id="loop-preview-fill" type="geojson" data={loopPreviewPolygon}>
            <Layer
              id="loop-preview-polygon-layer"
              type="fill"
              paint={{ 'fill-color': '#00ff88', 'fill-opacity': 0.15 }}
            />
          </Source>
        )}

        {/* Active Track Line */}
        <Source id="live-track" type="geojson" data={track}>
          <Layer
            id="live-track-line"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': '#00ff88', 'line-width': 5, 'line-opacity': 0.95 }}
          />
        </Source>

        {/* Loop Closure Connector (Dashed Line back to Start Fix) */}
        {loopClosingLine && (
          <Source id="loop-closing-line" type="geojson" data={loopClosingLine}>
            <Layer
              id="loop-closing-line-layer"
              type="line"
              layout={{ 'line-cap': 'round' }}
              paint={{
                'line-color': '#ffea00',
                'line-width': 3,
                'line-dasharray': [2, 2],
                'line-opacity': 0.9,
              }}
            />
          </Source>
        )}

        {/* Active City Event Banner */}
        <div className="map-event-banner" role="status">
          <Flame size={15} className="event-flame-icon" />
          <span>{t.events.banner}</span>
        </div>

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
                {selectedTerritory.mode === 'clan' ? (
                  <>
                    <Shield size={12} className="inline-icon" />
                    <span>KLAN AYMAǴI</span>
                  </>
                ) : (
                  <>
                    <User size={12} className="inline-icon" />
                    <span>JEKE AYMAQ</span>
                  </>
                )}
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

              {(() => {
                const decay = getTerritoryDecayInfo(selectedTerritory.createdAt);
                return (
                  <div className="popup-decay-section">
                    <div className="decay-header">
                      <Clock size={11} className="inline-icon" />
                      <span>{t.events.daysLeft(decay.daysLeft)}</span>
                    </div>
                    <div className="decay-bar-track">
                      <div
                        className="decay-bar-fill"
                        style={{
                          width: `${decay.percentRemaining}%`,
                          backgroundColor: decay.daysLeft < 10 ? '#ff5e6d' : selectedTerritory.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </Popup>
        )}





      {/* Selected Live Runner Profile Popup */}
      {selectedRunner && selectedRunner.location && (
        <Popup
          longitude={selectedRunner.location.lon}
          latitude={selectedRunner.location.lat}
          anchor="bottom"
          onClose={() => setSelectedRunner(null)}
          closeButton={true}
          closeOnClick={false}
          className="runner-popup-wrapper"
        >
          <div className="runner-popup-content">
            <div className="runner-popup-header">
              <div className="runner-avatar-badge" style={{ backgroundColor: selectedRunner.color || '#21D8A0' }}>
                <User size={18} color="#10251F" />
              </div>
              <div className="runner-popup-titles">
                <h3 className="runner-popup-name">{selectedRunner.display_name}</h3>
                <span className="runner-popup-id">ID: {selectedRunner.user_id}</span>
              </div>
            </div>

            <div className="runner-popup-status">
              <span className={`status-dot-inline ${selectedRunner.status === 'running' ? 'running' : 'online'}`} />
              <span>{selectedRunner.status === 'running' ? 'Juwırmaqta 🏃' : 'Onlayn'}</span>
            </div>

            <button
              type="button"
              className={`runner-friend-btn ${sentFriendRequests[selectedRunner.user_id] ? 'sent' : ''}`}
              onClick={() => handleFriendRequest(selectedRunner)}
              disabled={!!sentFriendRequests[selectedRunner.user_id]}
            >
              {sentFriendRequests[selectedRunner.user_id] ? (
                <>
                  <Check size={14} />
                  <span>{t.friends.sent}</span>
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>{t.friends.add}</span>
                </>
              )}
            </button>
          </div>
        </Popup>
      )}


      {/* Other active players/runners on the map */}
      {otherRunners.map((r) => {
        if (!r.location) return null;
        const color = r.color || '#21D8A0';
        return (
          <Marker
            key={`runner-${r.user_id}`}
            longitude={r.location.lon}
            latitude={r.location.lat}
            anchor="center"
          >
            <div
              className={`map-runner-pin ${r.status === 'running' ? 'is-running' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRunner(r);
                setSelectedTerritory(null);
              }}
              title={`${r.display_name} (ID: ${r.user_id})`}
            >
              <div className="runner-pin-dot" style={{ backgroundColor: color }}>
                <span className="runner-pin-icon" aria-hidden="true">
                  <User size={14} strokeWidth={2.5} color="#10251F" />
                </span>
                {r.status === 'running' && (
                  <span className="runner-pin-pulse" style={{ borderColor: color }} />
                )}
              </div>
            </div>
          </Marker>
        );
      })}


        {notice ? (
          <div className="map-notice" role="status">
            <p>{notice}</p>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        ) : null}
      </Map>

      {/* Floating Map Controls: Quick Theme Toggle & GPS location button */}
      <div className="map-floating-controls">
        {onToggleTheme && (
          <button
            type="button"
            className="map-floating-theme-btn"
            onClick={onToggleTheme}
            title={theme === 'night' ? 'Kúndizgi rejimge ótiw' : 'Keshki rejimge ótiw'}
            aria-label="Karta rejimin ózgertiw"
          >
            {theme === 'night' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}

        <button
          type="button"
          className={`map-floating-geo-btn ${locating ? 'locating' : ''}`}
          onClick={handleQuickLocate}
          title="Mening jaylasqan ornım (GPS)"
          aria-label="Mening jaylasqan ornım (GPS)"
        >
          <span className="geo-icon" aria-hidden="true">
            {locating ? <Loader2 size={18} className="spinning" /> : <Crosshair size={18} />}
          </span>
        </button>
      </div>

    </div>
  );
}

