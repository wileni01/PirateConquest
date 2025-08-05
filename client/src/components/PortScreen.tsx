import { useState } from "react";
import { usePirateGame } from "../lib/stores/usePirateGame";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";

// Import CARIBBEAN_LOCATIONS from MapView
const CARIBBEAN_LOCATIONS = [
  { id: 'port_royal', name: 'Port Royal', lat: 17.93, lon: -76.84, size: 'large', type: 'major_port', faction: 'english' },
  { id: 'tortuga', name: 'Tortuga', lat: 20.05, lon: -72.78, size: 'medium', type: 'pirate_haven', faction: 'french' },
  { id: 'nassau', name: 'Nassau', lat: 25.06, lon: -77.35, size: 'medium', type: 'pirate_haven', faction: 'pirate' },
  { id: 'havana', name: 'Havana', lat: 23.13, lon: -82.38, size: 'large', type: 'major_port', faction: 'spanish' },
];

// Trading goods with base prices and categories
const TRADE_GOODS = [
  // Food & Provisions
  { id: 'rum', name: 'Rum', category: 'provisions', basePrice: 15, unit: 'barrel' },
  { id: 'grain', name: 'Grain', category: 'provisions', basePrice: 8, unit: 'ton' },
  { id: 'salted_meat', name: 'Salted Meat', category: 'provisions', basePrice: 12, unit: 'barrel' },
  { id: 'fresh_water', name: 'Fresh Water', category: 'provisions', basePrice: 5, unit: 'barrel' },
  
  // Luxury Goods
  { id: 'sugar', name: 'Sugar', category: 'luxury', basePrice: 25, unit: 'ton' },
  { id: 'tobacco', name: 'Tobacco', category: 'luxury', basePrice: 30, unit: 'ton' },
  { id: 'coffee', name: 'Coffee', category: 'luxury', basePrice: 35, unit: 'ton' },
  { id: 'spices', name: 'Spices', category: 'luxury', basePrice: 50, unit: 'crate' },
  { id: 'silk', name: 'Silk', category: 'luxury', basePrice: 60, unit: 'bolt' },
  
  // Raw Materials
  { id: 'cotton', name: 'Cotton', category: 'raw', basePrice: 18, unit: 'bale' },
  { id: 'wood', name: 'Wood', category: 'raw', basePrice: 10, unit: 'ton' },
  { id: 'iron', name: 'Iron', category: 'raw', basePrice: 22, unit: 'ton' },
  
  // Military Supplies
  { id: 'gunpowder', name: 'Gunpowder', category: 'military', basePrice: 40, unit: 'keg' },
  { id: 'cannons', name: 'Cannons', category: 'military', basePrice: 200, unit: 'piece' },
  { id: 'muskets', name: 'Muskets', category: 'military', basePrice: 80, unit: 'crate' },
];

// Ship types available for purchase
const SHIP_TYPES = [
  { id: 'sloop', name: 'Sloop', price: 5000, crew: 20, cargo: 50, cannons: 8, speed: 9 },
  { id: 'brigantine', name: 'Brigantine', price: 12000, crew: 50, cargo: 100, cannons: 16, speed: 7 },
  { id: 'frigate', name: 'Frigate', price: 25000, crew: 150, cargo: 200, cannons: 32, speed: 6 },
  { id: 'galleon', name: 'Galleon', price: 50000, crew: 300, cargo: 400, cannons: 48, speed: 4 },
];

// Tavern characters and quest types
const TAVERN_CHARACTERS = [
  { id: 'merchant', name: 'Wealthy Merchant', type: 'trade' },
  { id: 'pirate', name: 'Grizzled Pirate', type: 'combat' },
  { id: 'sailor', name: 'Old Sailor', type: 'exploration' },
  { id: 'spy', name: 'Mysterious Stranger', type: 'espionage' },
];

export function PortScreen() {
  const { 
    player,
    currentPort,
    setGameState,
    buyGoods,
    sellGoods,
    repairShip,
    buyShip,
    sellShip,
    acceptMission
  } = usePirateGame() as any; // Type assertion to avoid TypeScript errors
  
  const [activeTab, setActiveTab] = useState("trade");
  const [selectedGood, setSelectedGood] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  
  if (!currentPort) {
    return null;
  }
  
  // Calculate dynamic prices based on port type and supply/demand
  const calculatePrice = (good: typeof TRADE_GOODS[0], isBuying: boolean) => {
    let price = good.basePrice;
    
    // Port type modifiers
    if (currentPort.type === 'major_port' && good.category === 'luxury') {
      price *= 0.8; // Luxury goods cheaper in major ports
    } else if (currentPort.type === 'pirate_haven' && good.category === 'military') {
      price *= 1.3; // Military goods more expensive in pirate havens
    }
    
    // Supply/demand simulation
    const supplyModifier = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    price *= supplyModifier;
    
    // Buying/selling spread
    if (isBuying) {
      price *= 1.1; // 10% markup when buying
    } else {
      price *= 0.9; // 10% markdown when selling
    }
    
    return Math.round(price);
  };
  
  // Generate available missions based on governor attitude
  const generateMissions = () => {
    const missions = [];
    
    if (currentPort.governor.attitude === 'friendly') {
      missions.push({
        id: 'escort',
        title: 'Escort Merchant Convoy',
        description: 'Protect our merchants from pirates',
        reward: 2000,
        type: 'escort'
      });
    }
    
    missions.push({
      id: 'delivery',
      title: 'Deliver Urgent Dispatches',
      description: `Deliver messages to ${CARIBBEAN_LOCATIONS[Math.floor(Math.random() * 10)].name}`,
      reward: 1000,
      type: 'delivery'
    });
    
    if (player.reputation > 50) {
      missions.push({
        id: 'hunt',
        title: 'Hunt Notorious Pirate',
        description: 'Eliminate a threat to our shipping',
        reward: 5000,
        type: 'combat'
      });
    }
    
    return missions;
  };
  
  const missions = generateMissions();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900/20 to-amber-950/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Port Header */}
        <Card className="mb-4 bg-black/80 border-amber-600">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl text-amber-400">{currentPort.name}</CardTitle>
                <p className="text-gray-300 mt-1">
                  {currentPort.faction.charAt(0).toUpperCase() + currentPort.faction.slice(1)} {currentPort.type.replace(/_/g, ' ')}
                </p>
              </div>
              <Button 
                onClick={() => setGameState('sailing')}
                className="bg-blue-600 hover:bg-blue-500"
              >
                Leave Port
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Governor:</span>
                <p className="text-amber-300">{currentPort.governor.name}</p>
              </div>
              <div>
                <span className="text-gray-400">Attitude:</span>
                <Badge className={
                  currentPort.governor.attitude === 'friendly' ? 'bg-green-600' :
                  currentPort.governor.attitude === 'hostile' ? 'bg-red-600' :
                  'bg-yellow-600'
                }>
                  {currentPort.governor.attitude}
                </Badge>
              </div>
              <div>
                <span className="text-gray-400">Fortification:</span>
                <Progress value={currentPort.fortification * 10} className="h-2 mt-1" />
              </div>
              <div>
                <span className="text-gray-400">Your Gold:</span>
                <p className="text-yellow-400 font-bold">{player.gold} pieces</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-black/60 border border-amber-600/50">
            <TabsTrigger value="trade" className="data-[state=active]:bg-amber-600">
              Trade Goods
            </TabsTrigger>
            <TabsTrigger value="shipyard" className="data-[state=active]:bg-amber-600">
              Shipyard
            </TabsTrigger>
            <TabsTrigger value="governor" className="data-[state=active]:bg-amber-600">
              Governor's Mansion
            </TabsTrigger>
            <TabsTrigger value="tavern" className="data-[state=active]:bg-amber-600">
              Tavern
            </TabsTrigger>
          </TabsList>
          
          {/* Trade Tab */}
          <TabsContent value="trade">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-black/80 border-amber-600">
                <CardHeader>
                  <CardTitle className="text-amber-400">Buy Goods</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {TRADE_GOODS.map(good => {
                        const price = calculatePrice(good, true);
                        return (
                          <div 
                            key={good.id}
                            className="flex justify-between items-center p-2 hover:bg-amber-900/20 rounded cursor-pointer"
                            onClick={() => setSelectedGood(good.id)}
                          >
                            <div>
                              <p className="text-amber-300">{good.name}</p>
                              <p className="text-xs text-gray-400">per {good.unit}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-yellow-400">{price} gold</p>
                              <Badge variant="outline" className="text-xs">
                                {good.category}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              
              <Card className="bg-black/80 border-amber-600">
                <CardHeader>
                  <CardTitle className="text-amber-400">Ship Cargo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Cargo Space:</span>
                      <span className="text-amber-300">
                        {player.cargo.current}/{player.cargo.max}
                      </span>
                    </div>
                    <Progress 
                      value={(player.cargo.current / player.cargo.max) * 100} 
                      className="h-2 mt-1"
                    />
                  </div>
                  
                  <ScrollArea className="h-80">
                    <div className="space-y-2">
                      {player.cargo.goods.map((item: any) => (
                        <div 
                          key={item.id}
                          className="flex justify-between items-center p-2 bg-amber-900/20 rounded"
                        >
                          <div>
                            <p className="text-amber-300">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.quantity} units</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => sellGoods(item.id, 1)}
                          >
                            Sell
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Shipyard Tab */}
          <TabsContent value="shipyard">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-black/80 border-amber-600">
                <CardHeader>
                  <CardTitle className="text-amber-400">Ship Repairs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Hull Integrity:</span>
                        <span className="text-amber-300">{player.health}/{player.maxHealth}</span>
                      </div>
                      <Progress value={(player.health / player.maxHealth) * 100} className="h-3" />
                    </div>
                    
                    <div className="p-4 bg-amber-900/20 rounded">
                      <p className="text-sm text-gray-300 mb-2">
                        Repair Cost: {Math.round((player.maxHealth - player.health) * 2)} gold
                      </p>
                      <Button 
                        onClick={() => repairShip()}
                        disabled={player.health === player.maxHealth}
                        className="w-full bg-green-600 hover:bg-green-500"
                      >
                        Repair Ship
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-black/80 border-amber-600">
                <CardHeader>
                  <CardTitle className="text-amber-400">Buy Ships</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-3">
                      {SHIP_TYPES.map(ship => (
                        <div key={ship.id} className="p-3 bg-amber-900/20 rounded">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-amber-300 font-semibold">{ship.name}</h4>
                            <Badge className="bg-yellow-600">{ship.price} gold</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                            <div>Crew: {ship.crew}</div>
                            <div>Cargo: {ship.cargo}</div>
                            <div>Cannons: {ship.cannons}</div>
                            <div>Speed: {ship.speed}/10</div>
                          </div>
                          <Button 
                            size="sm"
                            className="w-full mt-2"
                            disabled={player.gold < ship.price}
                            onClick={() => buyShip(ship.id)}
                          >
                            Purchase
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Governor Tab */}
          <TabsContent value="governor">
            <Card className="bg-black/80 border-amber-600">
              <CardHeader>
                <CardTitle className="text-amber-400">Governor's Mansion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-amber-900/20 rounded">
                  <p className="text-gray-300 italic">
                    "Welcome, Captain. {currentPort.governor.attitude === 'friendly' 
                      ? 'Your service to the crown is appreciated. Perhaps you can assist us further?'
                      : currentPort.governor.attitude === 'hostile'
                      ? 'Your presence here is... tolerated. Make your business quick.'
                      : 'State your business, Captain.'}
                  </p>
                </div>
                
                <h3 className="text-lg text-amber-400 mb-3">Available Missions</h3>
                <div className="space-y-3">
                  {missions.map(mission => (
                    <div key={mission.id} className="p-4 bg-amber-900/20 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-amber-300 font-semibold">{mission.title}</h4>
                        <Badge className="bg-yellow-600">{mission.reward} gold</Badge>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">{mission.description}</p>
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-500"
                        onClick={() => acceptMission(mission.id)}
                      >
                        Accept Mission
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tavern Tab */}
          <TabsContent value="tavern">
            <Card className="bg-black/80 border-amber-600">
              <CardHeader>
                <CardTitle className="text-amber-400">The Rusty Anchor Tavern</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4 italic">
                  The tavern is filled with smoke, laughter, and the sound of dice hitting tables...
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  {TAVERN_CHARACTERS.map(character => (
                    <Card 
                      key={character.id}
                      className="bg-amber-900/20 border-amber-700/50 cursor-pointer hover:bg-amber-900/30"
                      onClick={() => setSelectedCharacter(character.id)}
                    >
                      <CardContent className="p-4">
                        <h4 className="text-amber-300 font-semibold mb-2">{character.name}</h4>
                        <p className="text-sm text-gray-400">
                          {character.type === 'trade' && 'Has information about profitable trade routes'}
                          {character.type === 'combat' && 'Knows the location of enemy ships'}
                          {character.type === 'exploration' && 'Tales of hidden treasures and secret islands'}
                          {character.type === 'espionage' && 'Whispers secrets about faction politics'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {selectedCharacter && (
                  <div className="mt-4 p-4 bg-black/60 rounded">
                    <p className="text-amber-300 mb-3">
                      "Buy me a drink and I might share what I know..."
                    </p>
                    <Button 
                      className="bg-amber-600 hover:bg-amber-500"
                      onClick={() => {
                        // Handle character interaction
                        console.log('Buying drink for', selectedCharacter);
                      }}
                    >
                      Buy a Round (50 gold)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}