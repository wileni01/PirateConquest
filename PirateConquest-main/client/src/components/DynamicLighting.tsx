import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePirateGame } from '../lib/stores/usePirateGame';

function DynamicLighting() {
  const { weather, timeOfDay } = usePirateGame();
  const { scene } = useThree();
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);

  // Adjust fog based on weather/time
  useEffect(() => {
    if (weather === 'fog') {
      scene.fog = new THREE.FogExp2('#274472', 0.04);
    } else if (weather === 'storm') {
      scene.fog = new THREE.FogExp2('#1b3557', 0.02);
    } else {
      scene.fog = null;
    }
  }, [scene, weather]);

  // Simulate lightning flashes during storms
  useEffect(() => {
    if (!dirLightRef.current) return;
    if (weather !== 'storm') return;
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      if (Math.random() < 0.02 && dirLightRef.current) {
        const original = dirLightRef.current.intensity;
        dirLightRef.current.intensity = original * 2.2;
        setTimeout(() => {
          if (dirLightRef.current) dirLightRef.current.intensity = original;
        }, 120);
      }
      setTimeout(tick, 300 + Math.random() * 700);
    };
    tick();
    return () => { mounted = false; };
  }, [weather]);

  // Compute lighting based on time of day
  const ambientIntensity = timeOfDay === 'night' ? 0.15 : timeOfDay === 'dawn' || timeOfDay === 'dusk' ? 0.3 : 0.5;
  const dirIntensity = timeOfDay === 'night' ? 0.4 : timeOfDay === 'dawn' || timeOfDay === 'dusk' ? 0.8 : 1.0;
  const skyColor = timeOfDay === 'night' ? 0x0b1022 : timeOfDay === 'dawn' ? 0x6d86b5 : timeOfDay === 'dusk' ? 0x2e4a78 : 0x87ceeb;
  const groundColor = 0x223344;

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <hemisphereLight ref={hemiLightRef} args={[new THREE.Color(skyColor), new THREE.Color(groundColor), 0.35]} />
      <directionalLight ref={dirLightRef} position={[10, 20, 5]} intensity={dirIntensity} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
    </>
  );
}

export default DynamicLighting;


