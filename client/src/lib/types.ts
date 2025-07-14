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
    supplies: {
      food: number;
      rum: number;
      ammunition: number;
    };
    fleet: Ship[];
  };
  ships: Ship[];
  ports: Port[];
  cannonballs: Cannonball[];
  currentPort?: Port;
}

export type GameMode = 'menu' | 'sailing' | 'combat' | 'trading';
