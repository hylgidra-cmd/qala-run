import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, NavigationControl, Source } from 'react-map-gl/maplibre';
import { TerritoryLayer } from '../map/TerritoryLayer';
import { CITIES_LIST, DEFAULT_CITY_ID, getCity } from '../map/cities';
import { DEV_MAP_STYLE } from '../map/style';
import { formatArea } from '../run/format';
import { type AdminStats, type LiveRunner, fetchAdminStats, fetchLiveRunners } from './api';

interface AdminViewProps {
  onBack: () => void;
}

export function AdminView({ onBack }: AdminViewProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [runners, setRunners] = useState<LiveRunner[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string>(DEFAULT_CITY_ID);
  const mapRef = useRef<any>(null);

  const currentCity = getCity(selectedCityId);

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

  // When city changes, fly the map to the city
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [currentCity.center.longitude, currentCity.center.latitude],
        zoom: currentCity.zoom,
        duration: 1200,
      });
    }
  }, [currentCity]);

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
            color: runner.color || '#ff3b30',
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

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="admin-clear-button"
            style={{
              background: '#e2483d',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={async () => {
              if (window.confirm("Barlıq sızıqlar hám iyelengen jerlerdi kartadan óshiriwdi qáleysiz be?")) {
                try {
                  const { resetMap } = await import('./api');
                  await resetMap();
                  alert("Karta tolıq tazalandı!");
                  window.location.reload();
                } catch {
                  alert("Tazalawda qátelik júz berdi.");
                }
              }
            }}
          >
            🗑️ Kartanı tazalaw (Reset)
          </button>

          <button type="button" className="admin-back-button" onClick={onBack}>
            ← Kartaǵa qaytıw
          </button>
        </div>
      </header>

      <div className="admin-main">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          {/* City selector menu in left sidebar */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0,0,0,0.2)' }}>
            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#c7ff4a', fontWeight: 800, letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              🌍 Qalanı saylań
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {CITIES_LIST.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCityId(c.id)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: selectedCityId === c.id ? '2px solid #00ff88' : '1px solid rgba(255,255,255,0.1)',
                    background: selectedCityId === c.id ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: selectedCityId === c.id ? '#00ff88' : '#effff5',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: r.color || '#00ff88',
                          display: 'inline-block',
                          boxShadow: `0 0 6px ${r.color || '#00ff88'}`,
                        }}
                      />
                      <strong className="runner-name">{r.display_name}</strong>
                    </div>
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
            initialViewState={{ longitude: currentCity.center.longitude, latitude: currentCity.center.latitude, zoom: currentCity.zoom }}
            maxBounds={currentCity.bounds}
            minZoom={10}
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
                  'line-color': ['coalesce', ['get', 'color'], '#ff3b30'] as never,
                  'line-width': 5,
                  'line-opacity': 0.9,
                }}
              />
            </Source>

            {/* Runner current locations */}
            {runners.map((r) => {
              if (!r.location) return null;
              const runnerColor = r.color || '#00ff88';
              return (
                <Marker
                  key={`marker-${r.user_id}`}
                  longitude={r.location.lon}
                  latitude={r.location.lat}
                  anchor="bottom"
                  onClick={() => setSelectedUserId(r.user_id)}
                >
                  <div
                    className={`admin-marker ${r.status === 'running' ? 'running' : ''}`}
                    style={{
                      borderColor: runnerColor,
                      boxShadow: `0 0 12px ${runnerColor}88`,
                    }}
                  >
                    <span className="marker-pin">📍</span>
                    <span className="marker-label" style={{ color: runnerColor }}>{r.player_id}</span>
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

