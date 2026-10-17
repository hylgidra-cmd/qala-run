/**
 * Create and patch the native Android project for the Don't Stop APK.
 *
 * The generated `android/` directory is build output, not source: it is a few
 * hundred files of Gradle scaffolding that Capacitor can recreate at any time.
 * So it stays out of git, and the handful of files we actually own live in
 * `android-overlay/` and are copied over it here. That keeps the permission
 * set reviewable in a diff (docs/TZ-mobile-apk-v1.0.md section 5.1) without
 * committing a generated project.
 *
 * Running this twice is safe: an existing `android/` is patched, not recreated.
 *
 *   npm run cap:prepare
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = resolve(frontend, 'android');
const overlayDir = resolve(frontend, 'android-overlay');
const webDir = resolve(frontend, 'dist');

// Capacitor 6 ships Gradle 8.2.1, which refuses to start on Java 21 with
// "Unsupported class file major version 65". The APK workflow builds on
// Java 21 (TZ section 3), so the wrapper and AGP are moved to a pair that
// supports it. Both are plain version strings in generated files.
const GRADLE_VERSION = '8.11.1';
const AGP_VERSION = '8.7.3';

/**
 * Run the local Capacitor CLI.
 *
 * Node is spawned on the CLI's own entry point rather than on `npx`, because
 * Node refuses to spawn a Windows `.cmd` without a shell, and spawning one
 * through a shell concatenates the arguments. This way the same call works on
 * Windows, macOS and the Linux runner, with no shell in between.
 */
function capacitor(args) {
  const cli = resolve(frontend, 'node_modules/@capacitor/cli/bin/capacitor');

  console.log(`> cap ${args.join(' ')}`);
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: frontend,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`cap ${args.join(' ')} failed with status ${result.status}`);
  }
}

function patch(file, replacements) {
  if (!existsSync(file)) {
    console.warn(`  skipped (not found): ${file}`);
    return;
  }

  const before = readFileSync(file, 'utf8');
  let after = before;
  for (const [pattern, replacement] of replacements) {
    after = after.replace(pattern, replacement);
  }

  if (after !== before) {
    writeFileSync(file, after);
    console.log(`  patched ${file}`);
  } else {
    console.log(`  already current: ${file}`);
  }
}

if (!existsSync(webDir)) {
  console.error(
    'dist/ is missing. Capacitor copies the web build into the APK, so run ' +
      '`npm run build` first.',
  );
  process.exit(1);
}

// A half-deleted android/ - an interrupted clean, a locked file on Windows -
// would otherwise be patched as if it were a whole project and fail much
// later, in Gradle. The root build file is the marker for a usable one.
if (existsSync(androidDir) && !existsSync(resolve(androidDir, 'build.gradle'))) {
  console.log('android/ exists but is incomplete - removing it before regenerating.');
  rmSync(androidDir, { recursive: true, force: true });
}

if (existsSync(androidDir)) {
  console.log('android/ already exists - patching it in place.');
} else {
  console.log('android/ is missing - generating it with Capacitor.');
  capacitor(['add', 'android']);
}

console.log('Applying android-overlay/ ...');
cpSync(overlayDir, androidDir, { recursive: true });

console.log('Aligning Gradle and AGP with Java 21 ...');
patch(resolve(androidDir, 'gradle/wrapper/gradle-wrapper.properties'), [
  [/gradle-[0-9.]+-all\.zip/, `gradle-${GRADLE_VERSION}-all.zip`],
]);
patch(resolve(androidDir, 'build.gradle'), [
  [/com\.android\.tools\.build:gradle:[0-9.]+/, `com.android.tools.build:gradle:${AGP_VERSION}`],
]);

console.log('Android project ready. Next: npx cap sync android');
