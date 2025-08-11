// Build islands LOD meshes from GeoJSON into binary assets + spatial grid index
// Usage: node scripts/islands/build.js
import fs from 'fs';
import path from 'path';
import earcut from 'earcut';
import simplify from 'simplify-js';

const ROOT = path.resolve('.');
const INPUTS = [
  path.join(ROOT, 'client', 'public', 'caribbean-landmasses.json'),
  path.join(ROOT, 'client', 'public', 'caribbean-landmasses-example.json'),
];
const OUT_DIR = path.join(ROOT, 'client', 'public', 'islands');

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function readFirstExisting(paths) {
  for (const p of paths) if (fs.existsSync(p)) return p;
  return null;
}

function loadGeoJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function bboxOfPoints(points) {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  for (const p of points) {
    if (p[0] < minLon) minLon = p[0];
    if (p[0] > maxLon) maxLon = p[0];
    if (p[1] < minLat) minLat = p[1];
    if (p[1] > maxLat) maxLat = p[1];
  }
  return [minLon, minLat, maxLon, maxLat];
}

function projectLonLatToXY(lon, lat) {
  // Equirectangular projection, preserves straight segments acceptably for small regions
  const x = lon;
  const y = lat;
  return [x, y];
}

function triangulateLonLat(pointsLonLat) {
  // Earcut expects flat [x0,y0,x1,y1,...]. We ignore holes for now to keep assets compact.
  const flat = [];
  for (const [lon, lat] of pointsLonLat) {
    const [x, y] = projectLonLatToXY(lon, lat);
    flat.push(x, y);
  }
  const indices = earcut(flat);
  return { flatXY: new Float32Array(flat), indices: new Uint16Array(indices) };
}

function simplifyLonLat(pointsLonLat, tolerance) {
  const pts = pointsLonLat.map(([lon, lat]) => ({ x: lon, y: lat }));
  const simp = simplify(pts, tolerance, true);
  // Ensure polygon is closed and has minimum 3 points
  const arr = simp.map((p) => [p.x, p.y]);
  if (arr.length > 0) {
    const first = arr[0];
    const last = arr[arr.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) arr.push([first[0], first[1]]);
  }
  return arr.length >= 4 ? arr : pointsLonLat; // fall back if oversimplified
}

function* iteratePolygons(feature) {
  const geom = feature.geometry;
  if (!geom) return;
  if (geom.type === 'Polygon') {
    // Use outer ring only (index 0)
    if (Array.isArray(geom.coordinates?.[0])) yield geom.coordinates[0];
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      if (Array.isArray(poly?.[0])) yield poly[0];
    }
  }
}

function buildGridIndex(items, cellSizeDeg = 1) {
  // Uniform grid hash: key => array of item indices
  const grid = new Map();
  function key(ix, iy) { return `${ix},${iy}`; }
  for (let i = 0; i < items.length; i++) {
    const [minLon, minLat, maxLon, maxLat] = items[i].bbox;
    const ix0 = Math.floor(minLon / cellSizeDeg);
    const iy0 = Math.floor(minLat / cellSizeDeg);
    const ix1 = Math.floor(maxLon / cellSizeDeg);
    const iy1 = Math.floor(maxLat / cellSizeDeg);
    for (let ix = ix0; ix <= ix1; ix++) {
      for (let iy = iy0; iy <= iy1; iy++) {
        const k = key(ix, iy);
        const arr = grid.get(k) || [];
        arr.push(i);
        grid.set(k, arr);
      }
    }
  }
  const cells = [];
  for (const [k, arr] of grid.entries()) {
    cells.push({ key: k, indices: arr });
  }
  return { cellSizeDeg, cells };
}

function main() {
  ensureOutDir();
  const input = readFirstExisting(INPUTS);
  if (!input) {
    console.error('No GeoJSON found at', INPUTS);
    process.exit(1);
  }
  const gj = loadGeoJson(input);
  if (gj.type !== 'FeatureCollection' || !Array.isArray(gj.features)) {
    console.error('Invalid GeoJSON');
    process.exit(1);
  }

  const LODS = [
    { name: 0, tolerance: 0.02 }, // highest detail
    { name: 1, tolerance: 0.08 },
    { name: 2, tolerance: 0.20 }, // lowest detail
  ];

  const pieces = []; // metadata entries
  const vertexChunks = [];
  const indexChunks = [];

  for (const feat of gj.features) {
    const baseName = (feat.properties && (feat.properties.name || feat.properties.NAME)) || 'Island';
    for (const ring of iteratePolygons(feat) || []) {
      // Deduplicate sequential equal points
      const canonical = [];
      let prev = null;
      for (const pt of ring) {
        if (!prev || prev[0] !== pt[0] || prev[1] !== pt[1]) canonical.push(pt);
        prev = pt;
      }
      const baseBbox = bboxOfPoints(canonical);
      LODS.forEach((lod) => {
        const simp = simplifyLonLat(canonical, lod.tolerance);
        const { flatXY, indices } = triangulateLonLat(simp);
        if (indices.length === 0 || flatXY.length < 6) return; // skip degenerate
        const vOffset = vertexChunks.reduce((sum, a) => sum + a.length, 0) / 1; // floats count
        const iOffset = indexChunks.reduce((sum, a) => sum + a.length, 0) / 1; // indices count
        vertexChunks.push(flatXY);
        indexChunks.push(indices);
        pieces.push({
          name: baseName,
          lod: lod.name,
          bbox: baseBbox, // in lon/lat
          vOffset,
          vCount: flatXY.length / 2, // number of [x,y] pairs
          iOffset,
          iCount: indices.length,
        });
      });
    }
  }

  // Concatenate buffers
  const totalV = vertexChunks.reduce((sum, a) => sum + a.length, 0);
  const totalI = indexChunks.reduce((sum, a) => sum + a.length, 0);
  const vertices = new Float32Array(totalV);
  const indices = new Uint16Array(totalI);
  let vo = 0, io = 0;
  for (const arr of vertexChunks) { vertices.set(arr, vo); vo += arr.length; }
  for (const arr of indexChunks) { indices.set(arr, io); io += arr.length; }

  const grid = buildGridIndex(pieces);

  // Write outputs
  const binPath = path.join(OUT_DIR, 'meshes.bin');
  const fd = fs.openSync(binPath, 'w');
  // layout: [Float32 vertices][Uint16 indices]
  fs.writeFileSync(fd, Buffer.from(new Uint8Array(vertices.buffer)));
  fs.writeFileSync(fd, Buffer.from(new Uint8Array(indices.buffer)));
  fs.closeSync(fd);

  const indexPath = path.join(OUT_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify({
    version: 1,
    source: path.basename(input),
    vertices: { offsetBytes: 0, count: totalV },
    indices: { offsetBytes: vertices.byteLength, count: totalI },
    pieces,
    grid,
  }, null, 2));

  console.log('Built islands:', {
    features: gj.features.length,
    pieces: pieces.length,
    vertices: totalV / 2,
    triangles: totalI / 3,
    outDir: OUT_DIR,
  });
}

main();


