// Requires: npm i -D mapshaper
// Run: npm run build:caribbean-land
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const url = 'https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_land.zip';
const zip = 'ne_10m_land.zip';
const shpDir = 'ne_10m_land';
const out = path.join('client', 'public', 'caribbean-landmasses.geojson');

function fallbackCopy() {
  const fallback = path.join('client', 'public', 'caribbean-landmasses.json');
  if (fs.existsSync(fallback)) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.copyFileSync(fallback, out);
    console.warn('Natural Earth pipeline unavailable. Copied curated fallback to', out);
    process.exit(0);
  } else {
    console.error('No fallback found at', fallback);
    process.exit(1);
  }
}

try {
  // Download if needed
  if (!fs.existsSync(zip)) {
    execSync(`curl -L -o ${zip} ${url}`, { stdio: 'inherit' });
  }
  if (!fs.existsSync(shpDir)) {
    try {
      // Prefer PowerShell Expand-Archive on Windows
      execSync(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zip}' -DestinationPath '${shpDir}' -Force"`, { stdio: 'inherit' });
    } catch (e) {
      try {
        // Try tar as a fallback (Git Bash or WSL environments)
        execSync(`tar -xf ${zip}`, { stdio: 'inherit' });
      } catch (e2) {
        console.warn('Extraction failed, using curated fallback.');
        fallbackCopy();
      }
    }
  }

  // Clip bbox = [west, south, east, north]
  const west = -100, south = 6, east = -58, north = 33;

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(out), { recursive: true });

  // Keep-shapes to avoid dissolving small islands; simplify modestly to preserve Lesser Antilles
  try {
    execSync(
      `npx mapshaper ${shpDir}/ne_10m_land.shp ` +
      `-clip bbox=${west},${south},${east},${north} ` +
      `-simplify 8% keep-shapes ` +
      `-clean ` +
      `-o format=geojson precision=0.0001 ${out}`,
      { stdio: 'inherit' }
    );
    console.log('Wrote', out);
  } catch (e) {
    console.warn('mapshaper not available, using curated fallback.');
    fallbackCopy();
  }
} catch (e) {
  console.warn('Pipeline error, using curated fallback.');
  fallbackCopy();
}


