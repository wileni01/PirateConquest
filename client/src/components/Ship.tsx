import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Ship as ShipType } from "../lib/types";
import * as THREE from "three";

interface ShipProps {
  ship: ShipType;
  isPlayer: boolean;
}

function Ship({ ship, isPlayer }: ShipProps) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useTexture("/textures/wood.jpg");
  
  useFrame(() => {
    if (groupRef.current) {
      // Update position and rotation
      groupRef.current.position.set(...ship.position);
      groupRef.current.rotation.y = ship.rotation;
      
      // Add slight bobbing motion
      groupRef.current.position.y = ship.position[1] + Math.sin(Date.now() * 0.001) * 0.1;
    }
  });

  const shipColor = isPlayer ? "#8B4513" : ship.isEnemy ? "#800000" : "#654321";
  const sailColor = isPlayer ? "#FFFFFF" : ship.isEnemy ? "#000000" : "#F5F5DC";

  return (
    <group ref={groupRef}>
      {/* Ship hull */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3, 0.8, 6]} />
        <meshStandardMaterial map={texture} color={shipColor} />
      </mesh>
      
      {/* Ship deck */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2.5, 0.2, 5]} />
        <meshStandardMaterial map={texture} color="#DEB887" />
      </mesh>
      
      {/* Mast */}
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 4]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Main sail */}
      <mesh position={[0, 2, -0.5]} castShadow>
        <boxGeometry args={[0.1, 3, 2]} />
        <meshStandardMaterial color={sailColor} transparent opacity={0.9} />
      </mesh>
      
      {/* Cannons indicator */}
      {Array.from({ length: ship.cannons / 2 }).map((_, i) => (
        <group key={i}>
          <mesh position={[1.2, 0.3, 1 - i * 0.8]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.8]} />
            <meshStandardMaterial color="#2F4F4F" />
          </mesh>
          <mesh position={[-1.2, 0.3, 1 - i * 0.8]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.8]} />
            <meshStandardMaterial color="#2F4F4F" />
          </mesh>
        </group>
      ))}
      
      {/* Health bar */}
      <group position={[0, 4, 0]}>
        <mesh>
          <planeGeometry args={[3, 0.3]} />
          <meshBasicMaterial color="#FF0000" />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[3 * (ship.health / ship.maxHealth), 0.3]} />
          <meshBasicMaterial color="#00FF00" />
        </mesh>
      </group>
      
      {/* Player indicator */}
      {isPlayer && (
        <mesh position={[0, 5, 0]}>
          <sphereGeometry args={[0.2]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
      )}
    </group>
  );
}

export default Ship;
