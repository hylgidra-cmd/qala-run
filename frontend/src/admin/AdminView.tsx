import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, NavigationControl, Source } from 'react-map-gl/maplibre';
import { TerritoryLayer } from '../map/TerritoryLayer';
import { DEV_MAP_STYLE, NUKUS_CENTER, PILOT_BOUNDS } from '../map/style';
import { formatArea } from '../run/format';
import { type AdminStats, type LiveRunner, fetchAdminStats, fetchLiveRunners } from './api';

interface AdminViewProps {
  onBack: () => void;
}

export function AdminView({ onBack }: AdminViewProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [runners, setRunners] = useState<LiveRunner[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const mapRef = useRef<any>(null);

  const loadData = useCallback(async () => {
    try {
      const [newStats, newRunners] = await Promise.all([
        fetchAdminStats(),
        fetchLiveRunners(),
      ]);
      setStats(newStats);
      setRunners(newRunners);
    } catch {
      // Backend might be warming up
    }
  }, []);

  useEffect(() => {
    void loadData();
    const interval = window.setInterval(() => {
      void loadData();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [loadData]);

  // Combined tracks of all active runners
  const tracksGeoJson = useMemo<GeoJSON.FeatureCollection>(() => {
    const features: GeoJSON.Feature[] = [];

    for (const runner of runners) {
      if (runner.track && runner.track.length > 1) {
        features.push({
          type: 'Feature',
          properties: {
            userId: runner.user_id,
            name: runner.display_name,
            status: runner.status,
          },
          geometry: {
            type: 'LineString',
            coordinates: runner.track,
          },
        });
      }
    }

    return { type: 'FeatureCollection', features };
  }, [runners]);

  const flyToRunner = (runner: LiveRunner) => {
    setSelectedUserId(runner.user_id);
    if (runner.location && mapRef.current) {
      mapRef.current.flyTo({
        center: [runner.location.lon, runner.location.lat],
        zoom: 16,
        duration: 1000,
      });
    }
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-brand">
          <span className="brand-mark">DS</span>
          <strong>Don&apos;t Stop — Admin Baqlaw Orayı</strong>
        </div>

        {stats ? (
          <div className="admin-stats-summary">
            <span className="stat-pill">Oyınshılar: <strong>{stats.total_players}</strong></span>
            <span className="stat-pill highlight">Onlayn: <strong>{stats.online_players}</strong></span>
            <span className="stat-pill active">Juwırıwlar: <strong>{stats.active_runs}</strong></span>
            <span className="stat-pill">Iyelengen: <strong>{formatArea(stats.total_area_m2)}</strong></span>
          </div>
        ) : null}

        <button type="button" className="admin-back-button" onClick={onBack}>
          ← Kartaǵa qaytıw
        </button>
      </header>

      <div className="admin-main">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-head">
            <h3>Oyınshılar hám QR Paydalanıwshılar ({runners.length})</h3>
            <p className="admin-live-badge">● Jonlı yangılanıw</p>
          </div>

          <div className="admin-runner-list">
            {runners.length === 0 ? (
              <p className="admin-empty">Házirshe hesh kim joq</p>
            ) : (
              runners.map((r) => (
                <div
                  key={r.user_id}
                  className={`admin-runner-card ${r.status === 'running' ? 'running' : ''} ${
                    selectedUserId === r.user_id ? 'selected' : ''
                  }`}
                  onClick={() => flyToRunner(r)}
                >
                  <div className="runner-card-top">
                    <strong className="runner-name">{r.display_name}</strong>
                    <span className={`runner-status-badge ${r.status === 'running' ? 'active' : r.is_online ? 'online' : 'offline'}`}>
                      {r.status === 'running' ? 'Juwırmaqta 🏃' : r.is_online ? 'Onlayn 🟢' : 'Offlayn ⚪'}
                    </span>
                  </div>

                  <div className="runner-meta">
                    <span>ID: <strong>{r.player_id}</strong></span>
                    {r.points_count > 0 ? (
                      <span>Noqatlar: <strong>{r.points_count}</strong></span>
                    ) : null}
                  </div>

                  {r.location ? (
                    <div className="runner-action">
                      <button
                        type="button"
                        className="admin-track-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          flyToRunner(r);
                        }}
                      >
                        📍 Kartada kórsetiw
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Map Stage */}
        <section className="admin-map-stage">
          <Map
            ref={mapRef}
            mapStyle={DEV_MAP_STYLE}
            initialViewState={{ ...NUKUS_CENTER, zoom: 14 }}
            maxBounds={PILOT_BOUNDS}
            minZoom={11}
            maxZoom={19}
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" />

            {/* Captured Territories with vivid border and transparent fill */}
            <TerritoryLayer mode="solo" />

            {/* Live runner tracks */}
            <Source id="admin-live-tracks" type="geojson" data={tracksGeoJson}>
              <Layer
                id="admin-tracks-layer"
                type="line"
                paint={{
                  'line-color': '#ff3b30',
                  'line-width': 5,
                  'line-opacity': 0.9,
                }}
              />
            </Source>

            {/* Runner current locations */}
            {runners.map((r) => {
              if (!r.location) return null;
              return (
                <Marker
                  key={`marker-${r.user_id}`}
                  longitude={r.location.lon}
                  latitude={r.location.lat}
                  anchor="bottom"
                  onClick={() => setSelectedUserId(r.user_id)}
                >
                  <div className={`admin-marker ${r.status === 'running' ? 'running' : ''}`}>
                    <span className="marker-pin">📍</span>
                    <span className="marker-label">{r.player_id}</span>
                  </div>
                </Marker>
              );
            })}
          </Map>
        </section>
      </div>
    </div>
  );
}
