import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Cannonball as CannonballType } from "../lib/types";
import * as THREE from "three";

interface CannonballProps {
  cannonball: CannonballType;
}

function Cannonball({ cannonball }: CannonballProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...cannonball.position);
    }
  });

  return (
    <mesh ref={meshRef} castShadow>
      <sphereGeometry args={[0.2]} />
      <meshStandardMaterial color="#2F2F2F" metalness={0.8} roughness={0.2} />
    </mesh>
  );
}

export default Cannonball;
