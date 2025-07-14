import { Ship, Port } from "./types";

export function createPlayerShip(): Ship {
  return {
    id: 'player',
    position: [0, 0, 0],
    rotation: 0,
    health: 100,
    maxHealth: 100,
    crew: 20,
    maxCrew: 30,
    cannons: 8,
    speed: 8,
    isPlayer: true,
    type: 'sloop',
    isEnemy: false,
    lastFired: 0,
  };
}

export function createEnemyShip(position: [number, number, number]): Ship {
  return {
    id: `enemy_${Math.random().toString(36).substr(2, 9)}`,
    position,
    rotation: Math.random() * Math.PI * 2,
    health: 80,
    maxHealth: 80,
    crew: 15,
    maxCrew: 20,
    cannons: 6,
    speed: 6,
    isPlayer: false,
    type: 'sloop',
    isEnemy: true,
    lastFired: 0,
  };
}

export function generateInitialPorts(): Port[] {
  const portNames = [
    "Port Royal", "Tortuga", "Nassau", "Havana", "Cartagena",
    "Santo Domingo", "Kingston", "Bridgetown", "Port-au-Prince", "Campeche"
  ];

  return portNames.map((name, index) => {
    const angle = (index / portNames.length) * Math.PI * 2;
    const radius = 60 + Math.random() * 40;
    
    return {
      id: `port_${index}`,
      name,
      position: [
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ] as [number, number, number],
      faction: ['neutral', 'spanish', 'english', 'french', 'pirate'][Math.floor(Math.random() * 5)] as any,
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
    };
  });
}

export function spawnEnemyShips(playerPosition: [number, number, number]): Ship[] {
  const ships: Ship[] = [];
  const numShips = 3 + Math.floor(Math.random() * 3);
  
  for (let i = 0; i < numShips; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 50;
    const position: [number, number, number] = [
      playerPosition[0] + Math.cos(angle) * distance,
      0,
      playerPosition[2] + Math.sin(angle) * distance
    ];
    
    ships.push(createEnemyShip(position));
  }
  
  return ships;
}
