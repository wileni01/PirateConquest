import { Ship, Port } from "./types";

// Convert lat/lon to 3D world coordinates (matching the one in usePirateGame)
function latLonTo3D(lat: number, lon: number): [number, number, number] {
  const x = ((lon + 77.5) * 20);
  const z = ((20 - lat) * 20);
  return [x, 0, z];
}

export function createPlayerShip(): Ship {
  return {
    id: 'player',
    position: latLonTo3D(17.93, -76.84), // Start at Port Royal with real coordinates
    rotation: 0,
    health: 250,
    maxHealth: 250,
    crew: 30,
    maxCrew: 40,
    cannons: 8,
    speed: 8,
    isPlayer: true,
    type: 'sloop',
    isEnemy: false,
    lastFired: 0,
    lastFiredPort: 0,
    lastFiredStarboard: 0,
    morale: 80,
    maxMorale: 100,
    faction: 'english',
    cargo: {
      food: 0,
      rum: 0,
      ammunition: 60,
      treasure: 0,
    },
    maxCargo: 100,
  };
}

export function createEnemyShip(position: [number, number, number]): Ship {
  return {
    id: `enemy_${Math.random().toString(36).substr(2, 9)}`,
    position,
    rotation: Math.random() * Math.PI * 2,
    health: 150,
    maxHealth: 150,
    crew: 18,
    maxCrew: 24,
    cannons: 6,
    speed: 6,
    isPlayer: false,
    type: 'sloop',
    isEnemy: true,
    lastFired: 0,
    lastFiredPort: 0,
    lastFiredStarboard: 0,
    morale: 60,
    maxMorale: 100,
    faction: Math.random() < 0.5 ? 'spanish' : 'english',
    cargo: {
      food: 10 + Math.floor(Math.random() * 20),
      rum: 5 + Math.floor(Math.random() * 10),
      ammunition: 30 + Math.floor(Math.random() * 30),
      treasure: Math.floor(Math.random() * 15),
    },
    maxCargo: 80,
  };
}

export function generateInitialPorts(): Port[] {
  const portData = [
    { name: "Port Royal", faction: 'english', governor: "Sir William Beeston", type: 'major_port' },
    { name: "Tortuga", faction: 'pirate', governor: "Captain Bellamy", type: 'pirate_haven' },
    { name: "Nassau", faction: 'pirate', governor: "Blackbeard", type: 'pirate_haven' },
    { name: "Havana", faction: 'spanish', governor: "Don Carlos Menendez", type: 'major_port' },
    { name: "Cartagena", faction: 'spanish', governor: "Capitán Rodriguez", type: 'treasure_port' },
    { name: "Santo Domingo", faction: 'spanish', governor: "Almirante Santos", type: 'major_port' },
    { name: "Kingston", faction: 'english', governor: "Lord Pemberton", type: 'port' },
    { name: "Bridgetown", faction: 'english', governor: "Admiral Clarke", type: 'port' },
    { name: "Port-au-Prince", faction: 'french', governor: "Capitaine Dubois", type: 'port' },
    { name: "Campeche", faction: 'neutral', governor: "Señor Vásquez", type: 'port' }
  ];

  return portData.map((port, index) => {
    const angle = (index / portData.length) * Math.PI * 2;
    const radius = 60 + Math.random() * 40;
    
    return {
      id: `port_${index}`,
      name: port.name,
      position: [
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ] as [number, number, number],
      faction: port.faction as any,
      type: port.type as any,
      supplies: {
        food: 50 + Math.floor(Math.random() * 100),
        rum: 30 + Math.floor(Math.random() * 50),
        ammunition: 100 + Math.floor(Math.random() * 200),
        treasure: Math.floor(Math.random() * 50),
      },
      prices: {
        food: 2 + Math.floor(Math.random() * 3),
        rum: 5 + Math.floor(Math.random() * 5),
        ammunition: 3 + Math.floor(Math.random() * 4),
      },
      governor: {
        name: port.governor,
        attitude: ['friendly', 'neutral', 'hostile'][Math.floor(Math.random() * 3)] as any,
        bribes: Math.floor(Math.random() * 500),
      },
      fortification: 1 + Math.floor(Math.random() * 5),
      garrison: 50 + Math.floor(Math.random() * 200),
    };
  });
}

export function spawnEnemyShips(playerPosition: [number, number, number]): Ship[] {
  const ships: Ship[] = [];
  const numShips = 1 + Math.floor(Math.random() * 2);
  
  for (let i = 0; i < numShips; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 60 + Math.random() * 60;
    const position: [number, number, number] = [
      playerPosition[0] + Math.cos(angle) * distance,
      0,
      playerPosition[2] + Math.sin(angle) * distance
    ];
    
    ships.push(createEnemyShip(position));
  }
  
  return ships;
}
