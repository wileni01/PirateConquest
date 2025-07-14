import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { usePirateGame } from "../lib/stores/usePirateGame";
import * as THREE from "three";

function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture("/textures/sand.jpg");
  const { weather, timeOfDay } = usePirateGame();
  
  // Configure texture for water-like appearance
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 20);

  useFrame((state) => {
    if (meshRef.current) {
      // Animate texture for water movement effect
      const waveSpeed = weather === 'storm' ? 0.3 : 0.1;
      texture.offset.x = Math.sin(state.clock.elapsedTime * waveSpeed) * 0.01;
      texture.offset.y = state.clock.elapsedTime * (weather === 'storm' ? 0.05 : 0.02);
    }
  });

  // Get ocean color based on time of day and weather
  const getOceanColor = () => {
    let baseColor = "#1e40af"; // Default blue
    
    switch (timeOfDay) {
      case 'dawn':
        baseColor = "#4f46e5"; // Purple-blue
        break;
      case 'day':
        baseColor = "#1e40af"; // Blue
        break;
      case 'dusk':
        baseColor = "#7c3aed"; // Purple
        break;
      case 'night':
        baseColor = "#1e1b4b"; // Dark blue
        break;
    }
    
    if (weather === 'storm') {
      baseColor = "#374151"; // Dark gray for storms
    } else if (weather === 'fog') {
      baseColor = "#6b7280"; // Gray for fog
    }
    
    return baseColor;
  };

  const getOpacity = () => {
    if (weather === 'fog') return 0.6;
    if (weather === 'storm') return 0.9;
    return 0.8;
  };

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      receiveShadow
    >
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial
        map={texture}
        color={getOceanColor()}
        transparent
        opacity={getOpacity()}
      />
    </mesh>
  );
}

export default Ocean;
