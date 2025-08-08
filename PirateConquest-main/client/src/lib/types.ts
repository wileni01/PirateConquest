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
  type: 'sloop' | 'brigantine' | 'frigate' | 'galleon' | 'merchant';
  isEnemy: boolean;
  lastFired: number;
  lastFiredPort?: number;
  lastFiredStarboard?: number;
  lastHitAt?: number;
  morale: number;
  maxMorale: number;
  faction: 'neutral' | 'spanish' | 'english' | 'french' | 'pirate' | 'dutch' | 'danish';
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
  faction: 'neutral' | 'spanish' | 'english' | 'french' | 'pirate' | 'dutch' | 'danish';
  type: 'port' | 'major_port' | 'pirate_haven' | 'treasure_port' | 'island';
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
    cargo: {
      current: number;
      max: number;
      goods: {
        id: string;
        name: string;
        quantity: number;
      }[];
    };
  };
  ships: Ship[];
  ports: Port[];
  cannonballs: Cannonball[];
  currentPort?: Port;
  weather: 'clear' | 'storm' | 'fog';
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
  // New systems for Alpha
  activeMissions?: Mission[];
  lettersOfMarque?: Array<'spanish' | 'english' | 'french' | 'dutch' | 'danish'>;
  // Presentation state (non-persistent gameplay)
  cameraMode?: 'follow' | 'tactical';
  isStrategicMapOverlayOpen?: boolean;
}

export type GameMode = 'menu' | 'map' | 'sailing' | 'combat' | 'trading' | 'port';

// Duplicate of simple date structure to avoid cross-file type dependency
export interface SimpleDate {
  year: number;
  month: number;
  day: number;
}

export type MissionType = 'escort' | 'delivery' | 'combat';

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  originPortId: string;
  targetPortId?: string;
  reward: number;
  deadline?: SimpleDate;
  status: 'active' | 'completed' | 'failed';
}
