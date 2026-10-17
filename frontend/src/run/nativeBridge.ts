/**
 * The one place that knows whether Don't Stop is running inside the Android
 * APK or in a browser tab (docs/TZ-mobile-apk-v1.0.md sections 4.1 and 4.4).
 *
 * Everything above this module - the run tracker, the panel, the map - is
 * written once and works in both. In the APK the fixes come from a foreground
 * service that keeps recording with the screen off; in a browser they come
 * from `navigator.geolocation`, exactly as before.
 *
 * The plugins are imported lazily and only on a native platform, so a browser
 * build never pulls native-only code into the bundle and the test environment
 * never touches it.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import type {
  BackgroundGeolocationPlugin,
  CallbackError,
  Location as NativeLocation,
} from '@capacitor-community/background-geolocation';

import { type TrackPoint, toTrackPoint } from './api';

/** Browser geolocation options, unchanged from the web demo. */
const WEB_WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 2000,
  timeout: 15000,
};

export interface PositionWatch {
  /** Stops the watch. Safe to call more than once. */
  stop: () => void;
  /** True when the fixes come from the Android foreground service. */
  background: boolean;
}

export interface WatchStrings {
  /** Title of the Android notification that keeps the service alive. */
  notificationTitle: string;
  /** Body of that notification. */
  notificationMessage: string;
}

export type PositionHandler = (point: TrackPoint) => void;
export type PositionErrorHandler = (message: string) => void;

/** True only inside the APK. A browser - including a phone browser - is false. */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

let backgroundGeolocation: BackgroundGeolocationPlugin | null = null;

function backgroundPlugin(): BackgroundGeolocationPlugin {
  backgroundGeolocation ??= registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

  return backgroundGeolocation;
}

/**
 * A native fix in the shape the API already speaks.
 *
 * `simulated` is the plugin's own mock-location flag, so a Fake GPS app is
 * reported honestly and the server's anti-cheat can act on it. The browser
 * has no equivalent and always sends `mocked: false`.
 */
function fromNativeLocation(location: NativeLocation): TrackPoint {
  return {
    lat: location.latitude,
    lon: location.longitude,
    ts: (location.time ?? Date.now()) / 1000,
    accuracy: location.accuracy ?? null,
    speed: location.speed,
    mocked: location.simulated === true,
  };
}

function describeError(error: CallbackError): string {
  return error.code ? `${error.message} (${error.code})` : error.message;
}

function watchInBrowser(onPoint: PositionHandler, onError: PositionErrorHandler): PositionWatch {
  const id = navigator.geolocation.watchPosition(
    (position) => onPoint(toTrackPoint(position)),
    (positionError) => onError(positionError.message),
    WEB_WATCH_OPTIONS,
  );

  return {
    background: false,
    stop: () => navigator.geolocation.clearWatch(id),
  };
}

/**
 * Foreground-only native watch. Used when the background service cannot be
 * started - a denied "allow all the time" permission, mostly - so the run
 * still records while the player keeps the app open.
 */
async function watchInForeground(
  onPoint: PositionHandler,
  onError: PositionErrorHandler,
): Promise<PositionWatch> {
  const { Geolocation } = await import('@capacitor/geolocation');

  const id = await Geolocation.watchPosition(
    { enableHighAccuracy: true, timeout: WEB_WATCH_OPTIONS.timeout },
    (position, error) => {
      if (error) {
        onError(error.message);
        return;
      }
      if (!position) {
        return;
      }

      onPoint({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        ts: position.timestamp / 1000,
        accuracy: position.coords.accuracy ?? null,
        speed: position.coords.speed ?? null,
        mocked: false,
      });
    },
  );

  return {
    background: false,
    stop: () => void Geolocation.clearWatch({ id }),
  };
}

/**
 * Start recording positions on whichever platform this is.
 *
 * On Android this asks for a background watcher, which Android only grants
 * behind a foreground-service notification - that notification is what keeps
 * the fixes coming once the phone is in a pocket.
 */
export async function startPositionWatch(
  strings: WatchStrings,
  onPoint: PositionHandler,
  onError: PositionErrorHandler,
): Promise<PositionWatch> {
  if (!isNativeApp()) {
    return watchInBrowser(onPoint, onError);
  }

  try {
    const id = await backgroundPlugin().addWatcher(
      {
        backgroundTitle: strings.notificationTitle,
        backgroundMessage: strings.notificationMessage,
        requestPermissions: true,
        // A stale fix would be placed on the map as if the runner were there.
        stale: false,
        // The run pipeline needs every metre of the shape, so nothing is
        // filtered out here; the server decides what the track was.
        distanceFilter: 0,
      },
      (location?: NativeLocation, error?: CallbackError) => {
        if (error) {
          onError(describeError(error));
          return;
        }
        if (!location) {
          return;
        }

        onPoint(fromNativeLocation(location));
      },
    );

    return {
      background: true,
      stop: () => void backgroundPlugin().removeWatcher({ id }),
    };
  } catch {
    // Background was refused. Foreground tracking is still a usable run.
    return watchInForeground(onPoint, onError);
  }
}

/** Opens the app's system settings so a denied GPS permission can be fixed. */
export async function openLocationSettings(): Promise<void> {
  if (!isNativeApp()) {
    return;
  }

  try {
    await backgroundPlugin().openSettings();
  } catch {
    // Nothing else to offer the player here.
  }
}

/** The moments the phone is allowed to speak through vibration. */
export type HapticEvent = 'start' | 'flag' | 'loopReady' | 'captured';

/** Browser fallback patterns, in milliseconds. */
const VIBRATION_PATTERNS: Record<HapticEvent, number | number[]> = {
  start: 40,
  flag: 25,
  loopReady: [30, 60, 30],
  captured: [60, 80, 60, 80, 140],
};

async function nativeHaptic(event: HapticEvent): Promise<void> {
  const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');

  switch (event) {
    case 'start':
      await Haptics.impact({ style: ImpactStyle.Medium });
      return;
    case 'flag':
      await Haptics.impact({ style: ImpactStyle.Light });
      return;
    case 'loopReady':
      await Haptics.notification({ type: NotificationType.Warning });
      return;
    case 'captured':
      await Haptics.notification({ type: NotificationType.Success });
  }
}

/**
 * Vibrate for one of the four run moments. Native haptics in the APK, the
 * Vibration API in a browser that has one, silence everywhere else.
 *
 * Never throws: a phone that refuses to vibrate must not interrupt a run.
 */
export async function haptic(event: HapticEvent): Promise<void> {
  try {
    if (isNativeApp()) {
      await nativeHaptic(event);
      return;
    }

    navigator.vibrate?.(VIBRATION_PATTERNS[event]);
  } catch {
    // Vibration is decoration, not a feature a run depends on.
  }
}

/**
 * Full-screen game chrome: a dark status bar the layout draws under, and the
 * splash screen dismissed as soon as React has something to show.
 *
 * A no-op in a browser.
 */
export async function initNativeShell(): Promise<void> {
  if (!isNativeApp()) {
    return;
  }

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#10251F' });
  } catch {
    // An older WebView without the status-bar API still runs the game.
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {
    // The splash auto-hides after launchShowDuration anyway.
  }
}
