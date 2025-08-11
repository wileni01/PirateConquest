import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { FLAGS } from '../lib/flags';
import { loadIslands, lonLatToWorld, IslandPiece } from '../lib/islandsLoader';
import { IslandsCuller } from '../lib/islandsCulling';

type MeshBuffers = {
  position: THREE.BufferAttribute;
  index: THREE.BufferAttribute;
};

export default function Islands() {
  const { camera, gl } = useThree();
  const [ready, setReady] = useState(false);
  const assetsRef = useRef<{ vertices: Float32Array; indices: Uint16Array; indexJson: any } | null>(null);
  const cullerRef = useRef<IslandsCuller | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    let cancelled = false;
    if (!FLAGS.LOD_ISLANDS) return;
    loadIslands().then((assets) => {
      if (cancelled) return;
      assetsRef.current = { vertices: assets.vertices, indices: assets.indices, indexJson: assets.index } as any;
      cullerRef.current = new IslandsCuller(assets.index as any, camera as THREE.PerspectiveCamera);
      setReady(true);
    }).catch(() => {
      // no-op if assets missing
    });
    return () => { cancelled = true; };
  }, [camera]);

  // Frame update: refresh visible pieces with single merged geometry for minimal draw calls
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!groupRef.current) return;
    const mat = new THREE.MeshStandardMaterial({ color: '#6b8f5a' });
    materialRef.current = mat;
    const geom = new THREE.BufferGeometry();
    const mesh = new THREE.Mesh(geom, mat);
    mesh.receiveShadow = true;
    groupRef.current.add(mesh);
    meshRef.current = mesh;
    return () => {
      geom.dispose();
      mat.dispose();
      if (groupRef.current && mesh) groupRef.current.remove(mesh);
    };
  }, []);

  useFrame(() => {
    if (!FLAGS.LOD_ISLANDS) return;
    if (!cullerRef.current || !meshRef.current || !assetsRef.current) return;
    const visible = cullerRef.current.queryVisible(window.innerHeight, 2);
    const { vertices, indices } = assetsRef.current;
    // Precompute total sizes
    let totalV = 0;
    let totalI = 0;
    for (const { pieceIndex } of visible) {
      const p: IslandPiece = (assetsRef.current.indexJson.pieces[pieceIndex]) as IslandPiece;
      totalV += p.vCount;
      totalI += p.iCount;
    }
    if (totalV === 0 || totalI === 0) {
      (meshRef.current.geometry as THREE.BufferGeometry).setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
      (meshRef.current.geometry as THREE.BufferGeometry).setIndex(new THREE.BufferAttribute(new Uint16Array(0), 1));
      return;
    }
    const pos = new Float32Array(totalV * 3);
    const idx = new Uint16Array(totalI);
    let vCursor = 0;
    let iCursor = 0;
    let baseVertex = 0;
    for (const { pieceIndex } of visible) {
      const p: IslandPiece = (assetsRef.current.indexJson.pieces[pieceIndex]) as IslandPiece;
      for (let i = 0; i < p.vCount; i++) {
        const lon = vertices[(p.vOffset + i) * 2 + 0];
        const lat = vertices[(p.vOffset + i) * 2 + 1];
        const [x, y, z] = lonLatToWorld(lon, lat);
        pos[(vCursor + i) * 3 + 0] = x;
        pos[(vCursor + i) * 3 + 1] = y;
        pos[(vCursor + i) * 3 + 2] = z;
      }
      const sub = indices.subarray(p.iOffset, p.iOffset + p.iCount);
      for (let k = 0; k < sub.length; k++) idx[iCursor + k] = sub[k] + baseVertex;
      vCursor += p.vCount;
      iCursor += p.iCount;
      baseVertex += p.vCount;
    }
    const geom = meshRef.current.geometry as THREE.BufferGeometry;
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setIndex(new THREE.BufferAttribute(idx, 1));
    geom.computeVertexNormals();
    geom.computeBoundingSphere();
  });

  if (!FLAGS.LOD_ISLANDS) return null;
  return <group ref={groupRef} />;
}


