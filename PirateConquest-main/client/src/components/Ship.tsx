import { useMemo, useRef } from "react";
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
  const smokeTexture = useTexture("/textures/sky.png");
  
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

  // Damage visuals based on health
  const damageRatio = 1 - Math.max(0, Math.min(1, ship.health / ship.maxHealth));
  const tornSailOpacity = useMemo(() => 0.9 - damageRatio * 0.6, [damageRatio]);
  const hullDarken = useMemo(() => 1 - damageRatio * 0.4, [damageRatio]);

  return (
    <group ref={groupRef}>
      {/* Ship hull */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3, 0.8, 6]} />
        <meshStandardMaterial map={texture} color={shipColor} opacity={1} />
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
        <meshStandardMaterial color={sailColor} transparent opacity={tornSailOpacity} />
      </mesh>

      {/* Smoke/fire when heavily damaged */}
      {damageRatio > 0.5 && (
        <group position={[0, 1.2, 0]}>
          {Array.from({ length: 5 }).map((_, i) => (
            <sprite key={i} scale={[0.8 + i * 0.1, 0.8 + i * 0.1, 1]} position={[ (i-2)*0.1, i*0.25, 0 ]}>
              <spriteMaterial
                attach="material"
                transparent
                opacity={0.5 + 0.4 * Math.random()}
                map={smokeTexture as any}
                color={new THREE.Color(0.2, 0.2, 0.2)}
                depthWrite={false}
              />
            </sprite>
          ))}
        </group>
      )}
      
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

      {/* Side cooldown indicators */}
      <group position={[0, 3.5, 0]}>
        {/* Port */}
        <mesh position={[-1.8, 0, 0]}>
          <planeGeometry args={[0.6, 0.18]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
        <mesh position={[-1.8, 0, 0.01]}>
          <planeGeometry args={[0.6 * Math.min(1, Math.max(0, (Date.now() - (ship.lastFiredPort || 0)) / 5000)), 0.18]} />
          <meshBasicMaterial color="#9ca3af" />
        </mesh>
        {/* Starboard */}
        <mesh position={[1.8, 0, 0]}>
          <planeGeometry args={[0.6, 0.18]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
        <mesh position={[1.8, 0, 0.01]}>
          <planeGeometry args={[0.6 * Math.min(1, Math.max(0, (Date.now() - (ship.lastFiredStarboard || 0)) / 5000)), 0.18]} />
          <meshBasicMaterial color="#9ca3af" />
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
