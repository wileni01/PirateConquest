import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { useRef, useEffect } from "react";
import { usePirateGame } from "../lib/stores/usePirateGame";
import { useAudio } from "../lib/stores/useAudio";
import { spawnEnemyShips } from "../lib/gameLogic";
import Ocean from "./Ocean";
import Islands from "./Islands";
import Ship from "./Ship";
import Port from "./Port";
import Cannonball from "./Cannonball";
import TreasureMarker from "./TreasureMarker";
import * as THREE from "three";
import CinematicBattleController from "./CinematicBattleController";
import { perfBeginFrame, perfRecordUpdate, perfRecordAI, perfRecordCollision, perfAfterRender } from "../lib/perf";
import { FLAGS } from "../lib/flags";

function Game() {
  const { camera, scene, gl } = useThree();
  const {
    player,
    ships,
    ports,
    cannonballs,
    weather,
    timeOfDay,
    cameraMode,
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
  const accumulatorRef = useRef(0);
  const fixedDt = 1 / 60; // 60 Hz
  const enemiesSpawnedRef = useRef(false);
  const lastShotRef = useRef(0);

  // Spawn initial encounter once per sailing/combat session
  useEffect(() => {
    if (!enemiesSpawnedRef.current && (player.ship.health > 0)) {
      // Respect map/time/weather state already in store; just spawn a single encounter
      const enemies = spawnEnemyShips(player.ship.position).slice(0, 1);
      usePirateGame.setState((state) => ({
        ships: [...state.ships, ...enemies],
      }));
      enemiesSpawnedRef.current = true;
    }
  }, [player.ship.position, player.ship.health]);

  useFrame(() => {
    perfBeginFrame();
    const now = Date.now();
    const deltaTime = (now - lastUpdateRef.current) / 1000;
    lastUpdateRef.current = now;

    const keys = getKeys();
    const ship = player.ship;
    let newPosition = [...ship.position] as [number, number, number];
    let newRotation = ship.rotation;

    // Define an update step that is used for both variable and fixed timesteps
    const stepOnce = (dt: number) => {
      // Ship movement with simple inertia
      const moveSpeed = ship.speed * dt;
      const rotateSpeed = 1.5 * dt;

      if (keys.leftward) {
        newRotation -= rotateSpeed;
      }
      if (keys.rightward) {
        newRotation += rotateSpeed;
      }

      if (keys.forward) {
        newPosition[0] += Math.sin(newRotation) * moveSpeed;
        newPosition[2] += Math.cos(newRotation) * moveSpeed;
      } else {
        // slight drift forward like sail momentum
        newPosition[0] += Math.sin(newRotation) * moveSpeed * 0.2;
        newPosition[2] += Math.cos(newRotation) * moveSpeed * 0.2;
      }
      if (keys.backward) {
        newPosition[0] -= Math.sin(newRotation) * moveSpeed * 0.4;
        newPosition[2] -= Math.cos(newRotation) * moveSpeed * 0.4;
      }

      // Update game systems with perf timing
      const t0 = performance.now();
      updateCannonballs(dt);
      const t1 = performance.now();
      updateAI(dt);
      const t2 = performance.now();
      checkCollisions();
      const t3 = performance.now();
      perfRecordUpdate(t1 - t0);
      perfRecordAI(t2 - t1);
      perfRecordCollision(t3 - t2);
    };

    if (FLAGS.FIXED_STEP_SIM) {
      accumulatorRef.current += deltaTime;
      let iterations = 0;
      while (accumulatorRef.current >= fixedDt && iterations < 5) { // clamp to avoid spiral of death
        stepOnce(fixedDt);
        accumulatorRef.current -= fixedDt;
        iterations++;
      }
    } else {
      stepOnce(deltaTime);
    }

    // Broadsides by default when pressing Space: decide which side the target is on; fallback to bow if no target
    if (keys.fire && player.supplies.ammunition > 0) {
      // Gate rapid fire
      if (now - lastShotRef.current < 150) {
        // skip to avoid spamming audio/VFX, not changing core math
      } else {
        lastShotRef.current = now;
      }
      // Find closest enemy within 30 units
      let closest: { id: string; dx: number; dz: number; dist: number } | null = null;
      ships.forEach(s => {
        if (!s.isEnemy) return;
        const dx = s.position[0] - newPosition[0];
        const dz = s.position[2] - newPosition[2];
        const dist = Math.hypot(dx, dz);
        if (dist < 30 && (!closest || dist < closest.dist)) closest = { id: s.id, dx, dz, dist };
      });

      if (closest != null) {
        const { dx, dz } = closest;
        const angleToEnemy = Math.atan2(dx, dz);
        const relative = Math.atan2(Math.sin(angleToEnemy - newRotation), Math.cos(angleToEnemy - newRotation));
        const playerStore = usePirateGame.getState();
        if (relative > 0) playerStore.fireBroadside(ship.id, 'starboard'); else playerStore.fireBroadside(ship.id, 'port');
      } else {
        // Bow chaser if no close target
        const direction: [number, number, number] = [
          Math.sin(newRotation),
          0,
          Math.cos(newRotation)
        ];
        fireCannonball(ship.id, direction);
      }
      playHit();
    }
    // Manual broadsides: Q for port, R for starboard
    if (keys.broadsidePort) {
      usePirateGame.getState().fireBroadside(ship.id, 'port');
    }
    if (keys.broadsideStarboard) {
      usePirateGame.getState().fireBroadside(ship.id, 'starboard');
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
      ships.forEach(s => {
        if (s.isEnemy) {
          const distance = Math.sqrt(
            (newPosition[0] - s.position[0]) ** 2 +
            (newPosition[2] - s.position[2]) ** 2
          );
          if (distance < 3) {
            boardEnemyShip(s.id);
          }
        }
      });
    }

    updatePlayerPosition(newPosition, newRotation);

    // Cinematic/tactical camera behavior (presentation-only)
    if (cameraMode === 'tactical') {
      // Crow's nest overhead tactical angle
      camera.position.x = newPosition[0] + 0;
      camera.position.y = 35;
      camera.position.z = newPosition[2] + 0;
      camera.lookAt(newPosition[0], 0, newPosition[2]);
    } else {
      // Follow camera
      camera.position.x = newPosition[0];
      camera.position.y = 18;
      camera.position.z = newPosition[2] + 15;
      camera.lookAt(newPosition[0], 0, newPosition[2]);
    }

    // (Systems already updated in stepOnce)
    
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
    perfAfterRender(gl as any);
  });

  return (
    <>
      <Ocean />
      {/* Feature-flagged dynamic islands (LOD + culling) */}
      <Islands />
      <CinematicBattleController />
      
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
