import { useState } from 'react';
import Map, { GeolocateControl, NavigationControl } from 'react-map-gl/maplibre';
import { OUT_OF_BOUNDS_NOTICE, geolocationNotice, isInsidePilotBounds } from './geolocation';
import { DEV_MAP_STYLE, NUKUS_CENTER, PILOT_BOUNDS } from './style';

export function MapView() {
  const [notice, setNotice] = useState<string | null>(null);

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
