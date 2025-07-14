import { useState, useEffect } from "react";
import { usePirateGame } from "../lib/stores/usePirateGame";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { formatDate, getWindDescription } from "../lib/windSystem";

// Caribbean islands and their approximate positions
const CARIBBEAN_ISLANDS = [
  { id: 'jamaica', name: 'Jamaica', x: 250, y: 300, size: 'large' },
  { id: 'cuba', name: 'Cuba', x: 180, y: 200, size: 'large' },
  { id: 'hispaniola', name: 'Hispaniola', x: 350, y: 280, size: 'large' },
  { id: 'puerto_rico', name: 'Puerto Rico', x: 420, y: 270, size: 'medium' },
  { id: 'barbados', name: 'Barbados', x: 500, y: 380, size: 'small' },
  { id: 'trinidad', name: 'Trinidad', x: 480, y: 450, size: 'medium' },
  { id: 'martinique', name: 'Martinique', x: 460, y: 360, size: 'small' },
  { id: 'antigua', name: 'Antigua', x: 440, y: 320, size: 'small' },
  { id: 'st_lucia', name: 'St. Lucia', x: 470, y: 370, size: 'small' },
  { id: 'dominica', name: 'Dominica', x: 450, y: 350, size: 'small' },
];

function MapView() {
  const { 
    player, 
    ships, 
    ports, 
    gameState, 
    setGameState, 
    weather, 
    timeOfDay,
    currentDate,
    currentWinds,
    isSailing,
    sailingProgress,
    sailingDuration,
    sailingDestination,
    sailToIsland,
    updateSailing,
    updateAI,
    checkCollisions,
    updateCannonballs
  } = usePirateGame();

  const [selectedIsland, setSelectedIsland] = useState<string | null>(null);
  const [playerMapPosition, setPlayerMapPosition] = useState({ x: 250, y: 300 });
  const [encounterShips, setEncounterShips] = useState<typeof ships>([]);
  const [showEncounter, setShowEncounter] = useState(false);
  
  // Update sailing progress
  useEffect(() => {
    if (isSailing) {
      const interval = setInterval(() => {
        updateSailing(0.1); // Update every 100ms
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [isSailing, updateSailing]);

  // Convert 3D world position to map coordinates
  const worldToMap = (worldPos: [number, number, number]) => {
    return {
      x: Math.max(50, Math.min(550, (worldPos[0] + 200) * 1.5)),
      y: Math.max(50, Math.min(450, (worldPos[2] + 200) * 1.5))
    };
  };

  // Update player position on map based on 3D world position
  useEffect(() => {
    const mapPos = worldToMap(player.ship.position);
    setPlayerMapPosition(mapPos);
  }, [player.ship.position]);

  // Check for random encounters
  useEffect(() => {
    const encounterCheck = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every interval
        const nearbyEnemies = ships.filter(ship => 
          ship.isEnemy && Math.random() < 0.3 // 30% of enemies can encounter
        );
        
        if (nearbyEnemies.length > 0) {
          setEncounterShips(nearbyEnemies.slice(0, 2)); // Max 2 ships per encounter
          setShowEncounter(true);
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(encounterCheck);
  }, [ships]);

  const handleSailTo = (island: typeof CARIBBEAN_ISLANDS[0]) => {
    if (isSailing) return; // Prevent sailing while already sailing
    
    console.log(`Sailing to ${island.name} (${island.id})`);
    sailToIsland(island.id);
  };

  const handleEngageCombat = () => {
    setShowEncounter(false);
    setGameState('combat');
  };

  const handleEvadeCombat = () => {
    setShowEncounter(false);
    // Small chance of damage when evading
    if (Math.random() < 0.3) {
      console.log("Took damage while evading!");
    }
  };

  const getIslandColor = (island: typeof CARIBBEAN_ISLANDS[0]) => {
    const port = ports.find(p => 
      p.name.toLowerCase().includes(island.name.toLowerCase()) ||
      island.name.toLowerCase().includes(p.name.toLowerCase())
    );
    
    if (!port) return '#8B7355'; // Default brown
    
    switch (port.faction) {
      case 'spanish': return '#DC2626'; // Red
      case 'english': return '#2563EB'; // Blue
      case 'french': return '#7C3AED'; // Purple
      case 'pirate': return '#1F2937'; // Dark gray
      default: return '#059669'; // Green for neutral
    }
  };

  if (gameState !== 'map') return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-600 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-4 bg-black/80 border-amber-600 text-white">
          <CardHeader>
            <CardTitle className="text-center text-3xl font-bold text-amber-400">
              Caribbean Sea - Captain's Chart
            </CardTitle>
            <div className="flex justify-center space-x-6 text-sm">
              <div>📅 {formatDate(currentDate)}</div>
              <div>🌤️ {weather.charAt(0).toUpperCase() + weather.slice(1)}</div>
              <div>🕐 {timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}</div>
              <div>💨 {getWindDescription(currentWinds)}</div>
            </div>
            <div className="flex justify-center space-x-8 text-sm mt-2">
              <div>💰 {player.gold} gold</div>
              <div>🏴‍☠️ {player.capturedShips.length} ships</div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Map */}
          <Card className="lg:col-span-3 bg-blue-900/90 border-amber-600 text-white">
            <CardContent className="p-4">
              <div className="relative w-full h-96 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg overflow-hidden">
                {/* Water texture pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-full bg-repeat" style={{
                    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path d="M20 20c0-11.046-8.954-20-20-20v40c11.046 0 20-8.954 20-20z" fill="#1e40af" opacity="0.3"/></g></svg>')}")`,
                    backgroundSize: '40px 40px'
                  }} />
                </div>

                {/* Islands */}
                {CARIBBEAN_ISLANDS.map(island => (
                  <div
                    key={island.id}
                    className={`absolute cursor-pointer transition-all duration-200 hover:scale-110 ${
                      selectedIsland === island.id ? 'ring-2 ring-amber-400' : ''
                    }`}
                    style={{
                      left: `${island.x}px`,
                      top: `${island.y}px`,
                      width: island.size === 'large' ? '24px' : island.size === 'medium' ? '16px' : '12px',
                      height: island.size === 'large' ? '24px' : island.size === 'medium' ? '16px' : '12px',
                      backgroundColor: getIslandColor(island),
                      borderRadius: '4px',
                      border: '1px solid #92400e'
                    }}
                    onClick={() => setSelectedIsland(island.id)}
                    onDoubleClick={() => handleSailTo(island)}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-white whitespace-nowrap">
                      {island.name}
                    </div>
                  </div>
                ))}

                {/* Player ship */}
                <div
                  className={`absolute w-6 h-6 bg-red-600 rounded-full border-2 border-amber-400 flex items-center justify-center text-white text-xs font-bold transform -translate-x-1/2 -translate-y-1/2 ${
                    isSailing ? 'animate-bounce' : 'animate-pulse'
                  }`}
                  style={{
                    left: `${playerMapPosition.x}px`,
                    top: `${playerMapPosition.y}px`
                  }}
                >
                  {isSailing ? '⛵' : '⚓'}
                </div>
                
                {/* Sailing progress indicator */}
                {isSailing && (
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${playerMapPosition.x}px`,
                      top: `${playerMapPosition.y - 40}px`
                    }}
                  >
                    <div className="bg-black/80 text-white px-2 py-1 rounded text-xs">
                      Sailing to {sailingDestination}
                      <div className="w-20 bg-gray-600 rounded-full h-1 mt-1">
                        <div
                          className="bg-blue-400 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${sailingProgress * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-300 mt-1">
                        Day {Math.floor(sailingProgress * sailingDuration)} of {sailingDuration}
                      </div>
                    </div>
                  </div>
                )}

                {/* Enemy ships */}
                {ships.filter(ship => ship.isEnemy).map(ship => {
                  const mapPos = worldToMap(ship.position);
                  return (
                    <div
                      key={ship.id}
                      className="absolute w-4 h-4 bg-gray-800 rounded-full border border-red-400 flex items-center justify-center text-white text-xs transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${mapPos.x}px`,
                        top: `${mapPos.y}px`
                      }}
                    >
                      ⚔️
                    </div>
                  );
                })}

                {/* Buried treasure */}
                {player.buriedTreasure.map(treasure => {
                  const mapPos = worldToMap(treasure.position);
                  return (
                    <div
                      key={treasure.id}
                      className="absolute w-3 h-3 bg-yellow-500 rounded-full border border-yellow-300 transform -translate-x-1/2 -translate-y-1/2 animate-bounce"
                      style={{
                        left: `${mapPos.x}px`,
                        top: `${mapPos.y}px`
                      }}
                      title={`Buried treasure: ${treasure.gold} gold`}
                    >
                      💰
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Ship Status */}
          <Card className="bg-black/80 border-amber-600 text-white">
            <CardHeader>
              <CardTitle className="text-amber-400">Ship Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Hull:</span>
                  <span>{player.ship.health}/{player.ship.maxHealth}</span>
                </div>
                <Progress value={(player.ship.health / player.ship.maxHealth) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Crew:</span>
                  <span>{player.ship.crew}/{player.ship.maxCrew}</span>
                </div>
                <Progress value={(player.ship.crew / player.ship.maxCrew) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Morale:</span>
                  <span>{player.ship.morale}/{player.ship.maxMorale}</span>
                </div>
                <Progress value={(player.ship.morale / player.ship.maxMorale) * 100} className="h-2" />
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Food:</span>
                  <span>{player.supplies.food}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rum:</span>
                  <span>{player.supplies.rum}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ammunition:</span>
                  <span>{player.supplies.ammunition}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-600">
                <div className="flex justify-between text-sm">
                  <span>Reputation:</span>
                  <span className="text-green-400">{player.reputation}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Infamy:</span>
                  <span className="text-red-400">{player.infamy}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={() => setGameState('sailing')}
                  className="w-full bg-blue-600 hover:bg-blue-500"
                >
                  Set Sail
                </Button>
                <Button 
                  onClick={() => setGameState('menu')}
                  className="w-full bg-gray-600 hover:bg-gray-500"
                >
                  Back to Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Island Details */}
        {selectedIsland && (
          <Card className="mt-4 bg-black/80 border-amber-600 text-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-amber-400">
                    {CARIBBEAN_ISLANDS.find(i => i.id === selectedIsland)?.name}
                  </h3>
                  {(() => {
                    const island = CARIBBEAN_ISLANDS.find(i => i.id === selectedIsland);
                    const port = ports.find(p => 
                      p.name.toLowerCase().includes(island?.name.toLowerCase() || '') ||
                      island?.name.toLowerCase().includes(p.name.toLowerCase())
                    );
                    
                    return port ? (
                      <div className="text-sm text-gray-300">
                        <p>Port: {port.name}</p>
                        <p>Faction: <Badge className={`${
                          port.faction === 'spanish' ? 'bg-red-600' :
                          port.faction === 'english' ? 'bg-blue-600' :
                          port.faction === 'french' ? 'bg-purple-600' :
                          port.faction === 'pirate' ? 'bg-gray-800' : 'bg-green-600'
                        }`}>{port.faction}</Badge></p>
                        <p>Governor: {port.governor.name}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Uninhabited island</p>
                    );
                  })()}
                </div>
                <Button 
                  onClick={() => {
                    const island = CARIBBEAN_ISLANDS.find(i => i.id === selectedIsland);
                    if (island) handleSailTo(island);
                  }}
                  className="bg-green-600 hover:bg-green-500"
                  disabled={isSailing}
                >
                  {isSailing ? 'Currently Sailing...' : 'Sail To Island'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ship Encounter Modal */}
        {showEncounter && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-black/90 border-red-600 text-white max-w-md">
              <CardHeader>
                <CardTitle className="text-red-400 text-center">Ship Encounter!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center">
                  Enemy ships spotted on the horizon! {encounterShips.length} hostile vessel{encounterShips.length > 1 ? 's' : ''} approaching.
                </p>
                
                <div className="space-y-2">
                  {encounterShips.map(ship => (
                    <div key={ship.id} className="flex justify-between text-sm">
                      <span>{ship.type} (Crew: {ship.crew})</span>
                      <span className="text-red-400">Health: {ship.health}/{ship.maxHealth}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleEngageCombat}
                    className="flex-1 bg-red-600 hover:bg-red-500"
                  >
                    Engage in Combat
                  </Button>
                  <Button 
                    onClick={handleEvadeCombat}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-500"
                  >
                    Attempt to Evade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapView;