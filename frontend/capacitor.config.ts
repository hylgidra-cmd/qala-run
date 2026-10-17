import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor shell for the Android APK (docs/TZ-mobile-apk-v1.0.md section 5).
 *
 * The APK is the same web build inside a native WebView, so everything the
 * browser demo does keeps working; the native layer only adds what a browser
 * cannot do: background GPS, haptics and a full-screen game chrome.
 */
const config: CapacitorConfig = {
  appId: 'com.dontstop.qalarun',
  appName: "Don't Stop",
  webDir: 'dist',
  android: {
    // The API is HTTPS; mixed content would be a downgrade, never a need.
    allowMixedContent: false,
    backgroundColor: '#10251F',
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#10251F',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      // The app hides it as soon as React mounts; this is only the safety net
      // for a build that fails to boot, so the splash can never stick.
      launchAutoHide: true,
      launchShowDuration: 2000,
    },
    StatusBar: {
      // Full-screen game chrome: the WebView draws under the status bar and
      // the layout keeps clear of the notch with env(safe-area-inset-*).
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#10251F',
    },
  },
};

export default config;
