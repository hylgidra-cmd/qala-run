# Don't Stop — Android APK

The APK is the web build inside a Capacitor shell, not a second codebase.
Everything in `frontend/src` runs unchanged; the native layer only adds the
three things a browser cannot do (`docs/TZ-mobile-apk-v1.0.md` section 4):

| | Browser | APK |
| :--- | :--- | :--- |
| GPS with the screen off | stops | Android foreground service keeps recording |
| Mock-GPS detection | impossible | the plugin reports `simulated`, sent as `mocked` |
| Vibration | Vibration API, if any | native haptics |
| Chrome | address bar | full-screen, drawn under the notch |

Because the shell loads the same React app, **most changes need no new APK**:
push to `main`, the web service redeploys, and the installed app picks the
change up the next time it opens. A rebuild is only needed for the icon, the
app name, a new permission or a new native plugin.

## Build it

The APK is assembled in CI on every push to `main` and on demand from the
Actions tab: **Build Android APK** → the `dontstop-debug-apk` artifact.

Locally, with a JDK 21 and the Android SDK installed:

```bash
cd frontend
npm ci
npm run cap:build     # web build + generate/patch android/ + cap sync
npm run cap:apk       # ./gradlew assembleDebug
```

The APK lands in `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

## Why `android/` is not in git

`npm run cap:prepare` generates it from `capacitor.config.ts` whenever it is
missing, so it is build output rather than source. The files we actually own
live in `frontend/android-overlay/` and are copied over the generated project:
today that is `AndroidManifest.xml`, which is where the permission set stays
reviewable in a diff.

Add a file to `android-overlay/` at the same path it has inside `android/` to
take ownership of it. Editing `frontend/android/` directly works for a quick
local experiment, but the next clean build throws it away.

The script also moves the Gradle wrapper to 8.11.1 and AGP to 8.7.3, because
Capacitor 6 ships Gradle 8.2.1 and that refuses to start on Java 21.

## Permissions, and what each is for

| Permission | Why |
| :--- | :--- |
| `INTERNET` | the API |
| `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` | the run itself |
| `ACCESS_BACKGROUND_LOCATION` | recording with the app in the background |
| `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION` | the service that keeps GPS alive |
| `POST_NOTIFICATIONS` | Android 13+ needs it to show that service's notification |
| `WAKE_LOCK` | the browser fallback's screen lock |
| `VIBRATE` | haptics |

Android asks for "allow all the time" separately from "allow while using the
app". If the player refuses it, `startPositionWatch` falls back to a
foreground-only watch: the run still records while the app is open, and the
HUD simply does not show the pocket-mode badge.

## Offline buffer

Fixes are queued in memory and mirrored to `localStorage`
(`dontstop.pendingPoints`) on every upload attempt. Finishing a run retries
the queue three times before it asks the server to judge the shape; if it
still cannot get through, the run stays open and buffered and the finish
button retries from exactly where it stopped. Nothing is ever judged on half
a track.

## Release build

`npm run cap:apk assembleRelease` produces an unsigned release APK. Signing
needs a keystore, which is deliberately not in this repository — add it as
GitHub Actions secrets and a `signingConfigs` block in
`android-overlay/app/build.gradle` when the app is ready for a store.
