/**
 * Assemble the debug APK locally, the way the workflow does in CI.
 *
 *   npm run cap:build && npm run cap:apk
 *
 * Needs a JDK (21) and the Android SDK; Gradle downloads the rest itself.
 * CI calls gradlew directly, so this only exists to spare a developer the
 * Windows/Unix wrapper difference.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = resolve(frontend, 'android');

if (!existsSync(androidDir)) {
  console.error('android/ is missing. Run `npm run cap:build` first.');
  process.exit(1);
}

const wrapper = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const task = process.argv[2] ?? 'assembleDebug';

console.log(`> ${wrapper} ${task}`);
const result = spawnSync(wrapper, [task], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const output =
  task === 'assembleRelease'
    ? 'android/app/build/outputs/apk/release/'
    : 'android/app/build/outputs/apk/debug/app-debug.apk';

console.log(`APK is in ${output}`);
