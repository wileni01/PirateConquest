// Requires: npm i -D mapshaper
// Run: npm run build:caribbean-land
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const url = 'https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_land.zip';
const zip = 'ne_10m_land.zip';
const shpDir = 'ne_10m_land';
const out = path.join('client', 'public', 'caribbean-landmasses.geojson');

// Download if needed
if (!fs.existsSync(zip)) {
  execSync(`curl -L -o ${zip} ${url}`, { stdio: 'inherit' });
}
if (!fs.existsSync(shpDir)) {
  execSync(`unzip -o ${zip} -d ${shpDir}`, { stdio: 'inherit' });
}

// Clip bbox = [west, south, east, north]
const west = -100, south = 6, east = -58, north = 33;

// Ensure output directory exists
fs.mkdirSync(path.dirname(out), { recursive: true });

// Keep-shapes to avoid dissolving small islands; simplify modestly to preserve Lesser Antilles
execSync(
  `npx mapshaper ${shpDir}/ne_10m_land.shp ` +
  `-clip bbox=${west},${south},${east},${north} ` +
  `-simplify 8% keep-shapes ` +
  `-clean ` +
  `-o format=geojson precision=0.0001 ${out}`,
  { stdio: 'inherit' }
);

console.log('Wrote', out);


