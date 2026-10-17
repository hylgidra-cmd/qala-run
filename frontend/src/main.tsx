import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';
import { App } from './App';
import { initNativeShell } from './run/nativeBridge';

// Full-screen game chrome inside the APK, a no-op in a browser. It runs
// before render so the splash is dismissed the moment there is something to
// show (docs/TZ-mobile-apk-v1.0.md section 4.4).
void initNativeShell();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
