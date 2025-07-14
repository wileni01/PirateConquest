export interface Ship {
  id: string;
  position: [number, number, number];
  rotation: number;
  health: number;
  maxHealth: number;
  crew: number;
  maxCrew: number;
  cannons: number;
  speed: number;
  isPlayer: boolean;
  type: 'sloop' | 'frigate' | 'galleon' | 'merchant';
  isEnemy: boolean;
  lastFired: number;
  morale: number;
  maxMorale: number;
  cargo: {
    food: number;
    rum: number;
    ammunition: number;
    treasure: number;
  };
  maxCargo: number;
}

export interface Port {
  id: string;
  name: string;
  position: [number, number, number];
  faction: 'neutral' | 'spanish' | 'english' | 'french' | 'pirate';
  supplies: {
    food: number;
    rum: number;
    ammunition: number;
    treasure: number;
  };
  prices: {
    food: number;
    rum: number;
    ammunition: number;
  };
  governor: {
    name: string;
    attitude: 'friendly' | 'neutral' | 'hostile';
    bribes: number;
  };
  fortification: number;
  garrison: number;
}

export interface Cannonball {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  damage: number;
  shooterId: string;
  createdAt: number;
}

export interface GameState {
  player: {
    ship: Ship;
    gold: number;
    reputation: number;
    infamy: number;
    supplies: {
      food: number;
      rum: number;
      ammunition: number;
    };
    fleet: Ship[];
    capturedShips: Ship[];
    buriedTreasure: Array<{
      id: string;
      position: [number, number, number];
      gold: number;
      buried: Date;
    }>;
  };
  ships: Ship[];
  ports: Port[];
  cannonballs: Cannonball[];
  currentPort?: Port;
  weather: 'clear' | 'storm' | 'fog';
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
}

export type GameMode = 'menu' | 'map' | 'sailing' | 'combat' | 'trading';
