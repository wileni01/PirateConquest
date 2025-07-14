import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { usePirateGame } from "./lib/stores/usePirateGame";
import { useAudio } from "./lib/stores/useAudio";
import Game from "./components/Game";
import Menu from "./components/Menu";
import GameUI from "./components/GameUI";
import TradingMenu from "./components/TradingMenu";
import "@fontsource/inter";

// Define control keys for the pirate game
const controls = [
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "backward", keys: ["KeyS", "ArrowDown"] },
  { name: "leftward", keys: ["KeyA", "ArrowLeft"] },
  { name: "rightward", keys: ["KeyD", "ArrowRight"] },
  { name: "fire", keys: ["Space"] },
  { name: "board", keys: ["KeyE"] },
  { name: "escape", keys: ["Escape"] },
  { name: "bury", keys: ["KeyB"] },
];

function App() {
  const { gameState } = usePirateGame();
  const { setBackgroundMusic } = useAudio();
  const [showCanvas, setShowCanvas] = useState(false);

  // Debug logging
  console.log("Current game state:", gameState);

  // Initialize audio
  useEffect(() => {
    const music = new Audio("/sounds/background.mp3");
    music.loop = true;
    music.volume = 0.3;
    setBackgroundMusic(music);
    setShowCanvas(true);
  }, [setBackgroundMusic]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {showCanvas && (
        <KeyboardControls map={controls}>
          {gameState === 'menu' && <Menu />}
          
          {gameState === 'trading' && <TradingMenu />}

          {(gameState === 'sailing' || gameState === 'combat') && (
            <>
              <Canvas
                shadows
                camera={{
                  position: [0, 25, 15],
                  fov: 60,
                  near: 0.1,
                  far: 1000
                }}
                gl={{
                  antialias: true,
                  powerPreference: "default"
                }}
              >
                <color attach="background" args={["#1e40af"]} />
                
                {/* Lighting */}
                <ambientLight intensity={0.4} />
                <directionalLight
                  position={[10, 20, 5]}
                  intensity={1}
                  castShadow
                  shadow-mapSize-width={2048}
                  shadow-mapSize-height={2048}
                />

                <Suspense fallback={null}>
                  <Game />
                </Suspense>
              </Canvas>
              <GameUI />
            </>
          )}
        </KeyboardControls>
      )}
    </div>
  );
}

export default App;
