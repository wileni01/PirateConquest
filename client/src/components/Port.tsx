import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { Port as PortType } from "../lib/types";
import * as THREE from "three";

interface PortProps {
  port: PortType;
}

function Port({ port }: PortProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...port.position);
    }
  });

  const getFactionColor = (faction: string) => {
    switch (faction) {
      case 'spanish': return "#FFD700";
      case 'english': return "#FF0000";
      case 'french': return "#0000FF";
      case 'pirate': return "#800080";
      default: return "#808080";
    }
  };

  return (
    <group ref={groupRef}>
      {/* Port base */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[4, 4, 1]} />
        <meshStandardMaterial color="#DEB887" />
      </mesh>
      
      {/* Port buildings */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[3, 2, 3]} />
        <meshStandardMaterial color={getFactionColor(port.faction)} />
      </mesh>
      
      {/* Dock */}
      <mesh position={[0, 0.1, 5]} castShadow>
        <boxGeometry args={[6, 0.2, 2]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Flag */}
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[0.5, 3.5, 0]} castShadow>
        <planeGeometry args={[1, 0.6]} />
        <meshStandardMaterial color={getFactionColor(port.faction)} />
      </mesh>
      
      {/* Port name */}
      <Text
        position={[0, 4.5, 0]}
        fontSize={0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {port.name}
      </Text>
      
      {/* Interaction hint */}
      <Text
        position={[0, -1, 0]}
        fontSize={0.4}
        color="yellow"
        anchorX="center"
        anchorY="middle"
      >
        Press E to enter
      </Text>
    </group>
  );
}

export default Port;
