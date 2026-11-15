# Don't Stop — native Android app

Kotlin and Jetpack Compose, built screen by screen from the "Don't Stop Mobile
UI" design. It talks to the same API as the web demo (`/api/v1`) and will
replace the Capacitor shell in `frontend/`; until then both exist, and the
debug build installs beside the shell as `com.dontstop.qalarun.debug`.

## Build

Needs the Android SDK (platform 37) and a JDK 17 or newer; Android Studio's
bundled JDK works.

```bash
cd android
./gradlew :app:assembleDebug            # app/build/outputs/apk/debug/app-debug.apk
./gradlew :app:testDebugUnitTest        # JVM tests
./gradlew :app:lintDebug
./gradlew :app:connectedDebugAndroidTest   # UI tests, needs an emulator or phone
```

Versions are pinned in `gradle/libs.versions.toml` and nowhere else.

## Layout

| Path | What lives there |
| :--- | :--- |
| `ui/theme/` | Colours, type, shapes and icons from the design's token board |
| `ui/components/` | Pieces shared by screens (bottom bar) |
| `ui/navigation/` | Destinations and the shell with one back stack per tab |

## Design rules that are enforced

- Day and night palettes are Material 3 colour schemes in `ui/theme/Color.kt`.
  `ThemeContrastTest` fails if any text pairing drops below 4.5:1.
- Text is Outfit; figures (distance, time, area, ids) are Chakra Petch. Both
  are bundled under the SIL Open Font License (`licenses/`).
- Touch targets are at least 48 dp, 64 dp on the run screen (`Dimens`).
- Permissions are added to the manifest with the feature that needs them.

## Stages

1. **Foundation** — project, theme, navigation shell, bottom bar. *(done)*
2. Sign-in and profile setup.
3. Map: territories, exclusion zones, city.
4. Run engine: foreground GPS, offline queue, loop detection.
5. Result, history, leaderboard, profile, settings.
6. Clan and chat, subscription.
