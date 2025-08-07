import { usePirateGame } from "../lib/stores/usePirateGame";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

function Menu() {
  const { startGame, setGameState } = usePirateGame();

  const handleStartGame = () => {
    console.log("Set Sail button clicked!");
    startGame();
    console.log("startGame() called");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-600 relative overflow-hidden">
      {/* Background waves effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-400 to-transparent"></div>
      </div>

      <Card className="w-full max-w-md mx-4 bg-black/80 border-amber-600 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-amber-400 mb-2">
            CUTTHROATS
          </CardTitle>
          <p className="text-lg text-amber-200">Terror on the High Seas</p>
          <p className="text-sm text-gray-300 mt-2">
            A 3D Pirate Adventure inspired by the 90s classic
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-gray-300 space-y-2">
            <p>⚓ Start with a single ship and crew</p>
            <p>💰 Trade supplies and capture treasure</p>
            <p>⚔️ Engage in naval combat</p>
            <p>🏴‍☠️ Build your pirate reputation</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => setGameState('map')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg py-3 cursor-pointer z-10 relative rounded-md transition-colors duration-200"
              type="button"
              style={{ 
                border: 'none',
                outline: 'none',
                position: 'relative',
                zIndex: 100,
                pointerEvents: 'auto'
              }}
            >
              Caribbean Map
            </button>
            
            <button
              onClick={handleStartGame}
              className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold text-lg py-3 cursor-pointer z-10 relative rounded-md transition-colors duration-200"
              type="button"
              style={{ 
                border: 'none',
                outline: 'none',
                position: 'relative',
                zIndex: 100,
                pointerEvents: 'auto'
              }}
            >
              Set Sail!
            </button>
            
            <div className="text-xs text-gray-400 space-y-1">
              <p><strong>Controls:</strong></p>
              <p>WASD / Arrow Keys - Navigate</p>
              <p>Space - Fire Cannons</p>
              <p>E - Enter Port</p>
              <p>Escape - Menu</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Menu;
