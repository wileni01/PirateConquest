import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture("/textures/sand.jpg");
  
  // Configure texture for water-like appearance
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 20);

  useFrame((state) => {
    if (meshRef.current) {
      // Animate texture for water movement effect
      texture.offset.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.01;
      texture.offset.y = state.clock.elapsedTime * 0.02;
    }
  });

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
        color="#1e40af"
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

export default Ocean;
