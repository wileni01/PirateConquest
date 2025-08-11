import * as THREE from 'three';
import type { FeatureIndex } from './flags';

export type IslandPiece = {
  name: string;
  lod: number;
  bbox: [number, number, number, number];
  vOffset: number; // number of floats (x,y pairs)
  vCount: number;  // number of vertices (pairs)
  iOffset: number; // number of indices
  iCount: number;
};

export type IslandIndex = {
  version: number;
  source: string;
  vertices: { offsetBytes: number; count: number };
  indices: { offsetBytes: number; count: number };
  pieces: IslandPiece[];
  grid: { cellSizeDeg: number; cells: Array<{ key: string; indices: number[] }> };
};

export type LoadedIslands = {
  index: IslandIndex;
  vertices: Float32Array; // [x0,y0,x1,y1,...] in lon/lat equirect
  indices: Uint16Array;
};

export async function loadIslands(baseUrl: string = '/islands'): Promise<LoadedIslands> {
  const [idxRes, binRes] = await Promise.all([
    fetch(`${baseUrl}/index.json`),
    fetch(`${baseUrl}/meshes.bin`),
  ]);
  if (!idxRes.ok || !binRes.ok) throw new Error('Islands assets not found');
  const index: IslandIndex = await idxRes.json();
  const binBuf = await binRes.arrayBuffer();
  const vertices = new Float32Array(binBuf, index.vertices.offsetBytes, index.vertices.count);
  const indices = new Uint16Array(binBuf, index.indices.offsetBytes, index.indices.count);
  return { index, vertices, indices };
}

export function lonLatToWorld(lon: number, lat: number): [number, number, number] {
  // Match world scale used elsewhere: 1 unit ~= 20 km-scale; we map lon/lat to an approximate plane
  const x = (lon + 77.5) * 20; // align roughly with MapView conversion
  const z = (20 - lat) * 20;
  return [x, 0, z];
}

export function pieceScreenError(camera: THREE.Camera, piece: IslandPiece): number {
  // Simple heuristic: use bbox diagonal length in degrees as proxy for projected size; refined at runtime by distance
  const [minLon, minLat, maxLon, maxLat] = piece.bbox;
  const sizeDeg = Math.hypot(maxLon - minLon, maxLat - minLat);
  return sizeDeg;
}


