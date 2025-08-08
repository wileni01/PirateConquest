import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePirateGame } from '../lib/stores/usePirateGame';

// Presentation-only controller for camera shakes and cinematic beats
function CinematicBattleController() {
  const { camera } = useThree();
  const { player, ships } = usePirateGame();
  const shakeMagnitudeRef = useRef(0);
  const baseCameraPos = useRef<THREE.Vector3 | null>(null);
  const prevEnemyCountRef = useRef(0);
  const dollyFramesRef = useRef(0);

  // Screen shake trigger on recent hits (player or any ship)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let shouldShake = false;
      if (player.ship.lastHitAt && now - player.ship.lastHitAt < 400) shouldShake = true;
      for (const s of ships) {
        if (s.lastHitAt && now - s.lastHitAt < 400) { shouldShake = true; break; }
      }
      if (shouldShake) shakeMagnitudeRef.current = Math.min(0.6, shakeMagnitudeRef.current + 0.2);
    }, 100);
    return () => clearInterval(interval);
  }, [player.ship.lastHitAt, ships]);

  // Sweeping camera on new enemy spotted
  useEffect(() => {
    const enemies = ships.filter(s => s.isEnemy);
    if (enemies.length > prevEnemyCountRef.current) {
      dollyFramesRef.current = 45; // ~0.75s at 60fps
    }
    prevEnemyCountRef.current = enemies.length;
  }, [ships]);

  useFrame(() => {
    if (!baseCameraPos.current) baseCameraPos.current = camera.position.clone();
    if (shakeMagnitudeRef.current > 0.001) {
      const m = shakeMagnitudeRef.current;
      camera.position.x += (Math.random() - 0.5) * m;
      camera.position.y += (Math.random() - 0.5) * m * 0.4;
      camera.position.z += (Math.random() - 0.5) * m;
      shakeMagnitudeRef.current *= 0.9;
    }

    // Dolly effect
    if (dollyFramesRef.current > 0 && baseCameraPos.current) {
      const t = dollyFramesRef.current / 45;
      camera.position.y = baseCameraPos.current.y + 8 * t;
      camera.position.z = baseCameraPos.current.z + 6 * t;
      dollyFramesRef.current -= 1;
    }
  });

  return null;
}

export default CinematicBattleController;


