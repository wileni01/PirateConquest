import { usePirateGame } from "../lib/stores/usePirateGame";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useState } from "react";

function TradingMenu() {
  const { 
    player, 
    selectedPort, 
    buySupplies, 
    sellTreasure, 
    exitPort 
  } = usePirateGame();
  
  const [amounts, setAmounts] = useState({
    food: 10,
    rum: 10,
    ammunition: 10,
    treasure: 1,
  });

  if (!selectedPort) return null;

  const canAfford = (type: 'food' | 'rum' | 'ammunition', amount: number) => {
    return player.gold >= selectedPort.prices[type] * amount;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-600">
      <Card className="w-full max-w-4xl mx-4 bg-black/90 border-amber-600 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-amber-400">
            {selectedPort.name}
          </CardTitle>
          <p className="text-lg text-amber-200 capitalize">
            {selectedPort.faction} Port
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-lg text-green-400">
              Your Gold: {player.gold}
            </p>
            <p className="text-gray-300">
              Governor: {selectedPort.governor.name}
            </p>
            <p className="text-gray-300">
              Attitude: <span className={`${
                selectedPort.governor.attitude === 'friendly' ? 'text-green-400' :
                selectedPort.governor.attitude === 'hostile' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {selectedPort.governor.attitude}
              </span>
            </p>
            <p className="text-gray-300">
              Fortification: {selectedPort.fortification}/5
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buy supplies */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-amber-400">Buy Supplies</h3>
              
              {(['food', 'rum', 'ammunition'] as const).map(type => (
                <Card key={type} className="bg-gray-800/50 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="capitalize text-lg">{type}</span>
                      <span className="text-amber-400">
                        {selectedPort.prices[type]} gold each
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <Button
                        onClick={() => setAmounts(prev => ({ 
                          ...prev, 
                          [type]: Math.max(1, prev[type] - 10) 
                        }))}
                        className="bg-red-600 hover:bg-red-500 px-2 py-1 text-sm"
                      >
                        -10
                      </Button>
                      <span className="mx-4 min-w-[60px] text-center">
                        {amounts[type]}
                      </span>
                      <Button
                        onClick={() => setAmounts(prev => ({ 
                          ...prev, 
                          [type]: prev[type] + 10 
                        }))}
                        className="bg-green-600 hover:bg-green-500 px-2 py-1 text-sm"
                      >
                        +10
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>
                        Total: {selectedPort.prices[type] * amounts[type]} gold
                      </span>
                      <Button
                        onClick={() => buySupplies(type, amounts[type])}
                        disabled={!canAfford(type, amounts[type])}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600"
                      >
                        Buy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Current supplies and sell treasure */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-amber-400">Your Supplies</h3>
              
              <Card className="bg-gray-800/50 border-gray-600">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>🍖 Food:</span>
                    <span>{player.supplies.food}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🍺 Rum:</span>
                    <span>{player.supplies.rum}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>💣 Ammunition:</span>
                    <span>{player.supplies.ammunition}</span>
                  </div>
                </CardContent>
              </Card>

              {selectedPort.supplies.treasure > 0 && (
                <Card className="bg-gray-800/50 border-gray-600">
                  <CardContent className="p-4">
                    <h4 className="text-lg text-amber-400 mb-3">Sell Treasure</h4>
                    <p className="text-sm mb-3">
                      Available treasure: {selectedPort.supplies.treasure}
                    </p>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <Button
                        onClick={() => setAmounts(prev => ({ 
                          ...prev, 
                          treasure: Math.max(1, prev.treasure - 1) 
                        }))}
                        className="bg-red-600 hover:bg-red-500 px-2 py-1 text-sm"
                      >
                        -1
                      </Button>
                      <span className="mx-4 min-w-[60px] text-center">
                        {Math.min(amounts.treasure, selectedPort.supplies.treasure)}
                      </span>
                      <Button
                        onClick={() => setAmounts(prev => ({ 
                          ...prev, 
                          treasure: Math.min(selectedPort.supplies.treasure, prev.treasure + 1) 
                        }))}
                        className="bg-green-600 hover:bg-green-500 px-2 py-1 text-sm"
                      >
                        +1
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>
                        Value: {10 * Math.min(amounts.treasure, selectedPort.supplies.treasure)} gold
                      </span>
                      <Button
                        onClick={() => sellTreasure(amounts.treasure)}
                        disabled={selectedPort.supplies.treasure <= 0}
                        className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600"
                      >
                        Sell
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Pirate Fleet Status */}
          {player.capturedShips.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-bold text-amber-400 mb-3">Your Fleet</h3>
              <Card className="bg-gray-800/50 border-gray-600">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>🏴‍☠️ Captured Ships:</span>
                      <span>{player.capturedShips.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>💀 Your Infamy:</span>
                      <span className="text-red-400">{player.infamy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>⚰️ Buried Treasure:</span>
                      <span>{player.buriedTreasure.length} locations</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Exit port */}
          <div className="flex justify-center mt-6">
            <Button
              onClick={exitPort}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-3 text-lg"
            >
              Leave Port
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TradingMenu;
