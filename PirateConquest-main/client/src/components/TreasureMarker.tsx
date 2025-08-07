import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface TreasureMarkerProps {
  position: [number, number, number];
  gold: number;
}

function TreasureMarker({ position, gold }: TreasureMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
      // Gentle floating animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Treasure chest */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[1, 0.8, 0.6]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Gold lock */}
      <mesh position={[0, 0, 0.35]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.1]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
      
      {/* Treasure indicator */}
      <Text
        position={[0, 2, 0]}
        fontSize={0.6}
        color="#FFD700"
        anchorX="center"
        anchorY="middle"
      >
        💰 {gold}g
      </Text>
      
      {/* Interaction hint */}
      <Text
        position={[0, -1, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Buried Treasure
      </Text>
    </group>
  );
}

export default TreasureMarker;