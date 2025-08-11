// ts-node or transpile to JS for node
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { CARIBBEAN_PORTS } from '../client/data/ports.caribbean';
import { projectLatLon, CARIBBEAN_BOUNDS, MAP_MARGIN } from '../client/src/lib/geo';

const here = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(here, '..', 'client', 'public', 'ports.projected.json');

const projected = CARIBBEAN_PORTS.map((p) => {
  const { u, v } = projectLatLon({ lat: p.lat, lon: p.lon }, CARIBBEAN_BOUNDS, MAP_MARGIN);
  return { ...p, u, v };
});

mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(projected, null, 2));
console.log('Wrote', outPath);


