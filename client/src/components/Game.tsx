import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { useRef, useEffect } from "react";
import { usePirateGame } from "../lib/stores/usePirateGame";
import { useAudio } from "../lib/stores/useAudio";
import { spawnEnemyShips } from "../lib/gameLogic";
import Ocean from "./Ocean";
import Ship from "./Ship";
import Port from "./Port";
import Cannonball from "./Cannonball";
import TreasureMarker from "./TreasureMarker";
import * as THREE from "three";

function Game() {
  const { camera } = useThree();
  const {
    player,
    ships,
    ports,
    cannonballs,
    weather,
    timeOfDay,
    updatePlayerPosition,
    fireCannonball,
    updateCannonballs,
    checkCollisions,
    enterPort,
    updateAI,
    boardEnemyShip,
    updateWeather,
    updateTimeOfDay,
    buryTreasure,
  } = usePirateGame();
  
  const { playHit } = useAudio();
  const [subscribe, getKeys] = useKeyboardControls();
  const lastUpdateRef = useRef(Date.now());
  const enemiesSpawnedRef = useRef(false);

  // Spawn initial enemies
  useEffect(() => {
    if (!enemiesSpawnedRef.current) {
      const enemies = spawnEnemyShips(player.ship.position);
      usePirateGame.setState((state) => ({
        ships: [...state.ships, ...enemies],
      }));
      enemiesSpawnedRef.current = true;
    }
  }, [player.ship.position]);

  useFrame(() => {
    const now = Date.now();
    const deltaTime = (now - lastUpdateRef.current) / 1000;
    lastUpdateRef.current = now;

    const keys = getKeys();
    const ship = player.ship;
    let newPosition = [...ship.position] as [number, number, number];
    let newRotation = ship.rotation;

    // Ship movement
    const moveSpeed = ship.speed * deltaTime;
    const rotateSpeed = 2 * deltaTime;

    if (keys.leftward) {
      newRotation -= rotateSpeed;
    }
    if (keys.rightward) {
      newRotation += rotateSpeed;
    }

    if (keys.forward) {
      newPosition[0] += Math.sin(newRotation) * moveSpeed;
      newPosition[2] += Math.cos(newRotation) * moveSpeed;
    }
    if (keys.backward) {
      newPosition[0] -= Math.sin(newRotation) * moveSpeed * 0.5;
      newPosition[2] -= Math.cos(newRotation) * moveSpeed * 0.5;
    }

    // Fire cannons
    if (keys.fire && player.supplies.ammunition > 0) {
      const direction: [number, number, number] = [
        Math.sin(newRotation),
        0,
        Math.cos(newRotation)
      ];
      fireCannonball(ship.id, direction);
      playHit();
    }

    // Check for nearby ports and enemy ships for boarding
    if (keys.board) {
      // Check for nearby ports
      ports.forEach(port => {
        const distance = Math.sqrt(
          (newPosition[0] - port.position[0]) ** 2 +
          (newPosition[2] - port.position[2]) ** 2
        );
        if (distance < 5) {
          enterPort(port.id);
        }
      });
      
      // Check for nearby enemy ships to board
      ships.forEach(ship => {
        if (ship.isEnemy) {
          const distance = Math.sqrt(
            (newPosition[0] - ship.position[0]) ** 2 +
            (newPosition[2] - ship.position[2]) ** 2
          );
          if (distance < 3) {
            boardEnemyShip(ship.id);
          }
        }
      });
    }

    updatePlayerPosition(newPosition, newRotation);

    // Update camera to follow player
    camera.position.x = newPosition[0];
    camera.position.z = newPosition[2] + 15;
    camera.lookAt(newPosition[0], 0, newPosition[2]);

    // Update game systems
    updateCannonballs(deltaTime);
    updateAI(deltaTime);
    checkCollisions();
    
    // Update weather and time periodically
    if (Math.random() < 0.001) updateWeather();
    if (Math.random() < 0.0005) updateTimeOfDay();

    // Bury treasure
    if (keys.bury && player.gold >= 100) {
      buryTreasure(100);
    }

    // Log movement for debugging
    if (keys.forward || keys.backward || keys.leftward || keys.rightward) {
      console.log(`Player position: ${newPosition.map(n => n.toFixed(1)).join(', ')}, rotation: ${(newRotation * 180 / Math.PI).toFixed(1)}°`);
    }
  });

  return (
    <>
      <Ocean />
      
      {/* Player ship */}
      <Ship
        ship={player.ship}
        isPlayer={true}
      />
      
      {/* Enemy ships */}
      {ships.map(ship => (
        <Ship
          key={ship.id}
          ship={ship}
          isPlayer={false}
        />
      ))}
      
      {/* Ports */}
      {ports.map(port => (
        <Port
          key={port.id}
          port={port}
        />
      ))}
      
      {/* Cannonballs */}
      {cannonballs.map(ball => (
        <Cannonball
          key={ball.id}
          cannonball={ball}
        />
      ))}
      
      {/* Buried Treasure */}
      {player.buriedTreasure.map(treasure => (
        <TreasureMarker
          key={treasure.id}
          position={treasure.position}
          gold={treasure.gold}
        />
      ))}
    </>
  );
}

export default Game;
