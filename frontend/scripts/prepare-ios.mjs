/**
 * Prepare Capacitor iOS project for Apple App Store submission.
 *
 * Ensures ios/App/App/Info.plist contains the mandatory location permission
 * descriptions and UIBackgroundModes ('location') required by Apple Review
 * for GPS running & territory capture apps.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const plistPath = resolve(frontend, 'ios/App/App/Info.plist');

if (!existsSync(plistPath)) {
  console.log('ios/App/App/Info.plist not found yet. Run `npx cap add ios` on macOS first.');
  process.exit(0);
}

let plist = readFileSync(plistPath, 'utf8');

const requiredEntries = `
\t<key>NSLocationWhenInUseUsageDescription</key>
\t<string>Don't Stop juwırıw jolıńızdı xaritada sızıw hám aymaqlardı iyelew ushın GPS ornıńızdı paydalanadı.</string>
\t<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
\t<string>Telefon ekranı óshik waqıtta da juwırıw sızıǵı úzilmey dawam etiwi ushın fon rejiminde GPS ornıńız kerek boladı.</string>
\t<key>NSLocationAlwaysUsageDescription</key>
\t<string>Telefon ekranı óshik waqıtta da juwırıw sızıǵı úzilmey dawam etiwi ushın fon rejiminde GPS ornıńız kerek boladı.</string>
\t<key>UIBackgroundModes</key>
\t<array>
\t\t<string>location</string>
\t</array>
`;

if (!plist.includes('NSLocationWhenInUseUsageDescription')) {
  plist = plist.replace('</dict>\n</plist>', `${requiredEntries}</dict>\n</plist>`);
  writeFileSync(plistPath, plist, 'utf8');
  console.log('Patched ios/App/App/Info.plist with App Store GPS & Background Location permissions.');
} else {
  console.log('ios/App/App/Info.plist already contains GPS permissions.');
}
