import * as THREE from 'three';
import type { IslandIndex, IslandPiece, LoadedIslands } from './islandsLoader';

export type VisiblePiece = { pieceIndex: number; lod: number };

type GridLookup = Map<string, number[]>;

function buildGridLookup(index: IslandIndex): GridLookup {
  const map = new Map<string, number[]>();
  for (const cell of index.grid.cells) map.set(cell.key, cell.indices);
  return map;
}

function frustumCullsAabb(frustum: THREE.Frustum, bbox: [number, number, number, number]): boolean {
  // Convert lon/lat bbox to approximate world-space AABB and test
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const min = new THREE.Vector3((minLon + 77.5) * 20, -5, (20 - maxLat) * 20);
  const max = new THREE.Vector3((maxLon + 77.5) * 20, 5, (20 - minLat) * 20);
  const box = new THREE.Box3(min, max);
  return frustum.intersectsBox(box);
}

export class IslandsCuller {
  private index: IslandIndex;
  private grid: GridLookup;
  private camera: THREE.PerspectiveCamera;
  private frustum: THREE.Frustum = new THREE.Frustum();
  private projView: THREE.Matrix4 = new THREE.Matrix4();

  constructor(index: IslandIndex, camera: THREE.PerspectiveCamera) {
    this.index = index;
    this.grid = buildGridLookup(index);
    this.camera = camera;
  }

  private updateFrustum() {
    this.projView.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projView);
  }

  private gridKeyForLonLat(lon: number, lat: number): string {
    const s = this.index.grid.cellSizeDeg;
    return `${Math.floor(lon / s)},${Math.floor(lat / s)}`;
  }

  queryVisible(screenHeightPx: number, maxLod: number = 2): VisiblePiece[] {
    this.updateFrustum();
    // Sample camera center ray to get approximate lon/lat
    const camWorld = new THREE.Vector3();
    this.camera.getWorldPosition(camWorld);
    // approximate inverse of lonLatToWorld from loader
    const lon = camWorld.x / 20 - 77.5;
    const lat = 20 - camWorld.z / 20;
    const keys = [
      this.gridKeyForLonLat(lon, lat),
      this.gridKeyForLonLat(lon + 1, lat),
      this.gridKeyForLonLat(lon - 1, lat),
      this.gridKeyForLonLat(lon, lat + 1),
      this.gridKeyForLonLat(lon, lat - 1),
    ];
    const unique = new Set<number>();
    for (const k of keys) {
      const arr = this.grid.get(k);
      if (!arr) continue;
      for (const idx of arr) unique.add(idx);
    }
    const candidates = [...unique];
    // Group by logical piece (name + bbox)
    const groups = new Map<string, number[]>();
    for (const idx of candidates) {
      const p = this.index.pieces[idx];
      if (!frustumCullsAabb(this.frustum, p.bbox)) continue;
      const key = `${p.name}:${p.bbox.join(',')}`;
      const arr = groups.get(key) || [];
      arr.push(idx);
      groups.set(key, arr);
    }
    const vis: VisiblePiece[] = [];
    const fovRad = (this.camera.fov * Math.PI) / 180;
    const scale = screenHeightPx / (2 * Math.tan(fovRad / 2));
    for (const arr of groups.values()) {
      // Use first entry to compute bbox/world size
      const p0 = this.index.pieces[arr[0]];
      // Approx world-space diagonal from lon/lat bbox
      const min = new THREE.Vector3((p0.bbox[0] + 77.5) * 20, 0, (20 - p0.bbox[3]) * 20);
      const max = new THREE.Vector3((p0.bbox[2] + 77.5) * 20, 0, (20 - p0.bbox[1]) * 20);
      const worldDiag = min.distanceTo(max);
      const center = new THREE.Vector3((min.x + max.x) * 0.5, 0, (min.z + max.z) * 0.5);
      const dist = this.camera.getWorldPosition(new THREE.Vector3()).distanceTo(center);
      const projectedPx = (worldDiag / dist) * scale;
      // Cull tiny projected size
      if (projectedPx < 3) continue;
      // Choose LOD by projected size
      let desiredLod = 0;
      if (projectedPx < 20) desiredLod = Math.min(2, maxLod);
      else if (projectedPx < 80) desiredLod = Math.min(1, maxLod);
      // Find matching entry with desired LOD, else fallback to closest available
      let chosenIdx = arr.find((i) => this.index.pieces[i].lod === desiredLod);
      if (chosenIdx == null) {
        // fallback by nearest lod
        const candidates = arr.map((i) => this.index.pieces[i]);
        candidates.sort((a, b) => Math.abs(a.lod - desiredLod) - Math.abs(b.lod - desiredLod));
        const best = candidates[0];
        chosenIdx = this.index.pieces.indexOf(best);
      }
      vis.push({ pieceIndex: chosenIdx, lod: desiredLod });
    }
    return vis;
  }
}


