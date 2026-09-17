import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves a project site under /<repo>/; everything else
  // (dev server, Render, a tunnel) is served from the root.
  base: process.env.VITE_BASE ?? '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    // The browser Geolocation API needs a secure context, so a phone can only
    // test a real GPS run through an HTTPS tunnel (see TZ section 21.5).
    // DEV ONLY: this list must never be relaxed in a production build.
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8000', ws: true },
    },
  },
});
