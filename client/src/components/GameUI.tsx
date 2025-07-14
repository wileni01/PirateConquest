import { usePirateGame } from "../lib/stores/usePirateGame";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";

function GameUI() {
  const { player, gameState, setGameState, restartGame, weather, timeOfDay } = usePirateGame();
  const ship = player.ship;
  
  if (gameState !== 'sailing' && gameState !== 'combat') return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top left - Ship status */}
      <Card className="absolute top-4 left-4 bg-black/80 border-amber-600 text-white pointer-events-auto">
        <CardContent className="p-4 space-y-2">
          <div className="text-amber-400 font-bold text-lg">
            {ship.type.toUpperCase()}
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Health:</span>
              <span>{ship.health}/{ship.maxHealth}</span>
            </div>
            <Progress 
              value={(ship.health / ship.maxHealth) * 100} 
              className="h-2"
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Crew:</span>
              <span>{ship.crew}/{ship.maxCrew}</span>
            </div>
            <Progress 
              value={(ship.crew / ship.maxCrew) * 100} 
              className="h-2"
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Morale:</span>
              <span>{ship.morale}/{ship.maxMorale}</span>
            </div>
            <Progress 
              value={(ship.morale / ship.maxMorale) * 100} 
              className="h-2 bg-red-900"
            />
          </div>
          
          <div className="text-sm">
            <div>Cannons: {ship.cannons}</div>
          </div>
        </CardContent>
      </Card>

      {/* Top right - Resources */}
      <Card className="absolute top-4 right-4 bg-black/80 border-amber-600 text-white pointer-events-auto">
        <CardContent className="p-4 space-y-2">
          <div className="text-amber-400 font-bold text-lg">
            💰 {player.gold} Gold
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>🍖 Food:</span>
              <span>{player.supplies.food}</span>
            </div>
            <div className="flex justify-between">
              <span>🍺 Rum:</span>
              <span>{player.supplies.rum}</span>
            </div>
            <div className="flex justify-between">
              <span>💣 Ammo:</span>
              <span>{player.supplies.ammunition}</span>
            </div>
          </div>
          
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>⭐ Reputation:</span>
              <span>{player.reputation}</span>
            </div>
            <div className="flex justify-between">
              <span>💀 Infamy:</span>
              <span>{player.infamy}</span>
            </div>
            <div className="flex justify-between">
              <span>🏴‍☠️ Fleet:</span>
              <span>{player.capturedShips.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom center - Game controls */}
      <Card className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 border-amber-600 text-white pointer-events-auto">
        <CardContent className="p-4">
          <div className="flex space-x-4 text-sm">
            <div>WASD: Move</div>
            <div>Space: Fire</div>
            <div>E: Enter Port / Board Ship</div>
            <div>B: Bury Treasure (100g)</div>
            <Button
              onClick={() => setGameState('menu')}
              className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 text-xs"
            >
              Menu (ESC)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Top center - Weather and time */}
      <Card className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 border-amber-600 text-white pointer-events-auto">
        <CardContent className="p-2">
          <div className="flex space-x-4 text-sm">
            <div>🌤️ {weather.charAt(0).toUpperCase() + weather.slice(1)}</div>
            <div>🕐 {timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Game Over screen */}
      {ship.health <= 0 && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto">
          <Card className="bg-red-900/90 border-red-600 text-white">
            <CardContent className="p-8 text-center space-y-4">
              <h2 className="text-3xl font-bold text-red-400">SHIP DESTROYED!</h2>
              <p className="text-lg">Your pirate career has come to an end...</p>
              <p>Final Gold: {player.gold}</p>
              <p>Reputation: {player.reputation}</p>
              <Button
                onClick={restartGame}
                className="bg-amber-600 hover:bg-amber-500 text-black font-bold px-6 py-2"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default GameUI;
