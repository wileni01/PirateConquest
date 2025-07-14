import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { GameState, Ship, Port, Cannonball, GameMode } from "../types";
import { generateInitialPorts, createPlayerShip } from "../gameLogic";
import { GameDate, WindData, getHistoricalWinds, calculateSailingTime, calculateBearing, PIRATE_LOCATIONS, advanceDate } from "../windSystem";

interface PirateGameState extends GameState {
  gameState: GameMode;
  selectedPort?: Port;
  currentDate: GameDate;
  currentWinds: WindData;
  isSailing: boolean;
  sailingProgress: number;
  sailingDuration: number;
  sailingDestination?: string;
  sailingStartPosition: [number, number, number];
  sailingEndPosition: [number, number, number];
  
  // Actions
  startGame: () => void;
  setGameState: (state: GameMode) => void;
  updatePlayerPosition: (position: [number, number, number], rotation: number) => void;
  fireCannonball: (shipId: string, direction: [number, number, number]) => void;
  updateCannonballs: (deltaTime: number) => void;
  checkCollisions: () => void;
  enterPort: (portId: string) => void;
  exitPort: () => void;
  buySupplies: (type: 'food' | 'rum' | 'ammunition', amount: number) => void;
  sellTreasure: (amount: number) => void;
  updateAI: (deltaTime: number) => void;
  restartGame: () => void;
  boardEnemyShip: (shipId: string) => void;
  buryTreasure: (amount: number) => void;
  updateWeather: () => void;
  updateTimeOfDay: () => void;
  sailToIsland: (islandId: string) => void;
  updateSailing: (deltaTime: number) => void;
}

const initialGameDate: GameDate = { year: 1692, month: 3, day: 15 };

const initialState: GameState = {
  player: {
    ship: createPlayerShip(),
    gold: 1000,
    reputation: 0,
    infamy: 0,
    supplies: {
      food: 50,
      rum: 30,
      ammunition: 100,
    },
    fleet: [],
    capturedShips: [],
    buriedTreasure: [],
  },
  ships: [],
  ports: generateInitialPorts(),
  cannonballs: [],
  currentPort: undefined,
  weather: 'clear',
  timeOfDay: 'day',
};

export const usePirateGame = create<PirateGameState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    gameState: 'menu',
    selectedPort: undefined,
    currentDate: initialGameDate,
    currentWinds: getHistoricalWinds(initialGameDate),
    isSailing: false,
    sailingProgress: 0,
    sailingDuration: 0,
    sailingDestination: undefined,
    sailingStartPosition: [0, 0, 0],
    sailingEndPosition: [0, 0, 0],

    startGame: () => {
      console.log("Starting pirate adventure!");
      set({ gameState: 'sailing' });
    },

    setGameState: (gameState: GameMode) => {
      set({ gameState });
    },

    restartGame: () => {
      set({
        ...initialState,
        gameState: 'menu',
        selectedPort: undefined,
      });
    },

    updatePlayerPosition: (position: [number, number, number], rotation: number) => {
      set((state) => ({
        player: {
          ...state.player,
          ship: {
            ...state.player.ship,
            position,
            rotation,
          },
        },
      }));
    },

    fireCannonball: (shipId: string, direction: [number, number, number]) => {
      const state = get();
      const ship = shipId === state.player.ship.id 
        ? state.player.ship 
        : state.ships.find(s => s.id === shipId);

      if (!ship) return;

      const now = Date.now();
      if (now - ship.lastFired < 2000) return; // 2 second cooldown

      // Check ammunition for player
      if (shipId === state.player.ship.id && state.player.supplies.ammunition <= 0) {
        console.log("No ammunition!");
        return;
      }

      const cannonball: Cannonball = {
        id: `cannonball_${now}_${Math.random()}`,
        position: [ship.position[0], ship.position[1] + 1, ship.position[2]],
        velocity: [direction[0] * 15, 0, direction[2] * 15],
        damage: 25,
        shooterId: shipId,
        createdAt: now,
      };

      set((state) => {
        const newState = { ...state };
        newState.cannonballs = [...state.cannonballs, cannonball];
        
        // Update last fired time
        if (shipId === state.player.ship.id) {
          newState.player = {
            ...state.player,
            ship: { ...state.player.ship, lastFired: now },
            supplies: {
              ...state.player.supplies,
              ammunition: Math.max(0, state.player.supplies.ammunition - 1),
            },
          };
        } else {
          newState.ships = state.ships.map(ship => 
            ship.id === shipId ? { ...ship, lastFired: now } : ship
          );
        }

        return newState;
      });

      console.log(`Ship ${shipId} fired cannonball!`);
    },

    updateCannonballs: (deltaTime: number) => {
      set((state) => ({
        cannonballs: state.cannonballs
          .map(ball => ({
            ...ball,
            position: [
              ball.position[0] + ball.velocity[0] * deltaTime,
              ball.position[1],
              ball.position[2] + ball.velocity[2] * deltaTime,
            ] as [number, number, number],
          }))
          .filter(ball => {
            const age = Date.now() - ball.createdAt;
            const distance = Math.sqrt(ball.position[0] ** 2 + ball.position[2] ** 2);
            return age < 5000 && distance < 200; // Remove after 5 seconds or if too far
          }),
      }));
    },

    checkCollisions: () => {
      const state = get();
      
      state.cannonballs.forEach(ball => {
        // Check collision with player ship
        if (ball.shooterId !== state.player.ship.id) {
          const playerShip = state.player.ship;
          const distance = Math.sqrt(
            (ball.position[0] - playerShip.position[0]) ** 2 +
            (ball.position[2] - playerShip.position[2]) ** 2
          );
          
          if (distance < 2) {
            console.log("Player ship hit!");
            set((state) => ({
              player: {
                ...state.player,
                ship: {
                  ...state.player.ship,
                  health: Math.max(0, state.player.ship.health - ball.damage),
                },
              },
              cannonballs: state.cannonballs.filter(b => b.id !== ball.id),
            }));
          }
        }

        // Check collision with enemy ships
        state.ships.forEach(ship => {
          if (ball.shooterId !== ship.id) {
            const distance = Math.sqrt(
              (ball.position[0] - ship.position[0]) ** 2 +
              (ball.position[2] - ship.position[2]) ** 2
            );
            
            if (distance < 2) {
              console.log(`Ship ${ship.id} hit!`);
              set((state) => ({
                ships: state.ships.map(s => 
                  s.id === ship.id 
                    ? { ...s, health: Math.max(0, s.health - ball.damage) }
                    : s
                ).filter(s => s.health > 0), // Remove destroyed ships
                cannonballs: state.cannonballs.filter(b => b.id !== ball.id),
              }));
              
              // Add gold, reputation, and infamy for destroying enemy ships
              if (ball.shooterId === state.player.ship.id && ship.isEnemy) {
                const loot = ship.cargo;
                set((state) => ({
                  player: {
                    ...state.player,
                    gold: state.player.gold + 200,
                    reputation: state.player.reputation + 10,
                    infamy: state.player.infamy + 5,
                    supplies: {
                      food: state.player.supplies.food + loot.food,
                      rum: state.player.supplies.rum + loot.rum,
                      ammunition: state.player.supplies.ammunition + loot.ammunition,
                    },
                  },
                }));
                console.log(`Enemy ship destroyed! Looted: ${loot.food} food, ${loot.rum} rum, ${loot.ammunition} ammo`);
              }
            }
          }
        });
      });
    },

    enterPort: (portId: string) => {
      const state = get();
      const port = state.ports.find(p => p.id === portId);
      if (port) {
        console.log(`Entering port: ${port.name}`);
        set({ 
          currentPort: port,
          selectedPort: port,
          gameState: 'trading' 
        });
      }
    },

    exitPort: () => {
      console.log("Leaving port");
      set({ 
        currentPort: undefined,
        selectedPort: undefined,
        gameState: 'sailing' 
      });
    },

    buySupplies: (type: 'food' | 'rum' | 'ammunition', amount: number) => {
      const state = get();
      if (!state.currentPort) return;

      const cost = state.currentPort.prices[type] * amount;
      if (state.player.gold >= cost) {
        set((state) => ({
          player: {
            ...state.player,
            gold: state.player.gold - cost,
            supplies: {
              ...state.player.supplies,
              [type]: state.player.supplies[type] + amount,
            },
          },
        }));
        console.log(`Bought ${amount} ${type} for ${cost} gold`);
      } else {
        console.log("Not enough gold!");
      }
    },

    sellTreasure: (amount: number) => {
      const state = get();
      if (!state.currentPort) return;

      const availableTreasure = Math.min(amount, state.currentPort.supplies.treasure);
      const value = availableTreasure * 10; // 10 gold per treasure
      
      set((state) => ({
        player: {
          ...state.player,
          gold: state.player.gold + value,
        },
        ports: state.ports.map(port =>
          port.id === state.currentPort?.id
            ? {
                ...port,
                supplies: {
                  ...port.supplies,
                  treasure: port.supplies.treasure - availableTreasure,
                },
              }
            : port
        ),
      }));
      console.log(`Sold ${availableTreasure} treasure for ${value} gold`);
    },

    updateAI: (deltaTime: number) => {
      const state = get();
      const playerPos = state.player.ship.position;

      set((state) => ({
        ships: state.ships.map(ship => {
          if (!ship.isEnemy) return ship;

          // Simple AI: move towards player and fire if in range
          const dx = playerPos[0] - ship.position[0];
          const dz = playerPos[2] - ship.position[2];
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          if (distance > 15) {
            // Move towards player
            const moveSpeed = ship.speed * deltaTime;
            const dirX = dx / distance;
            const dirZ = dz / distance;
            
            return {
              ...ship,
              position: [
                ship.position[0] + dirX * moveSpeed,
                ship.position[1],
                ship.position[2] + dirZ * moveSpeed,
              ] as [number, number, number],
              rotation: Math.atan2(dirX, dirZ),
            };
          } else if (distance < 12) {
            // Fire at player
            const now = Date.now();
            if (now - ship.lastFired > 3000) { // 3 second cooldown for AI
              const direction = [dx / distance, 0, dz / distance];
              get().fireCannonball(ship.id, direction as [number, number, number]);
            }
          }
          
          return ship;
        }),
      }));
    },

    boardEnemyShip: (shipId: string) => {
      const state = get();
      const enemyShip = state.ships.find(s => s.id === shipId);
      if (!enemyShip) return;

      const playerShip = state.player.ship;
      const distance = Math.sqrt(
        (playerShip.position[0] - enemyShip.position[0]) ** 2 +
        (playerShip.position[2] - enemyShip.position[2]) ** 2
      );

      if (distance < 3) {
        // Boarding combat simulation
        const playerCombatPower = playerShip.crew * (playerShip.morale / 100);
        const enemyCombatPower = enemyShip.crew * (enemyShip.morale / 100);
        
        if (playerCombatPower > enemyCombatPower) {
          // Victory! Capture the ship
          const capturedShip = { ...enemyShip, isEnemy: false };
          
          set((state) => ({
            ships: state.ships.filter(s => s.id !== shipId),
            player: {
              ...state.player,
              capturedShips: [...state.player.capturedShips, capturedShip],
              gold: state.player.gold + 100,
              reputation: state.player.reputation + 15,
              infamy: state.player.infamy + 10,
              supplies: {
                food: state.player.supplies.food + enemyShip.cargo.food,
                rum: state.player.supplies.rum + enemyShip.cargo.rum,
                ammunition: state.player.supplies.ammunition + enemyShip.cargo.ammunition,
              },
            },
          }));
          
          console.log(`Ship captured! Added to your fleet.`);
        } else {
          // Defeat - lose some crew
          set((state) => ({
            player: {
              ...state.player,
              ship: {
                ...state.player.ship,
                crew: Math.max(1, state.player.ship.crew - 5),
                morale: Math.max(10, state.player.ship.morale - 20),
              },
            },
          }));
          
          console.log(`Boarding failed! Lost crew and morale.`);
        }
      }
    },

    buryTreasure: (amount: number) => {
      const state = get();
      if (state.player.gold >= amount) {
        const treasureSpot = {
          id: `treasure_${Date.now()}`,
          position: [...state.player.ship.position] as [number, number, number],
          gold: amount,
          buried: new Date(),
        };

        set((state) => ({
          player: {
            ...state.player,
            gold: state.player.gold - amount,
            buriedTreasure: [...state.player.buriedTreasure, treasureSpot],
          },
        }));

        console.log(`Buried ${amount} gold at current location`);
      }
    },

    updateWeather: () => {
      const weatherTypes = ['clear', 'storm', 'fog'] as const;
      const newWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
      set({ weather: newWeather });
    },

    updateTimeOfDay: () => {
      const times = ['dawn', 'day', 'dusk', 'night'] as const;
      const state = get();
      const currentIndex = times.indexOf(state.timeOfDay);
      const nextIndex = (currentIndex + 1) % times.length;
      set({ timeOfDay: times[nextIndex] });
    },

    sailToIsland: (islandId: string) => {
      const state = get();
      const currentPos = state.player.ship.position;
      
      const destPos = WORLD_POSITIONS[islandId];
      if (!destPos) {
        console.warn(`No world position found for location: ${islandId}`);
        return;
      }
      
      // Calculate distance and sailing time
      const currentLocation = getCurrentLocationId(currentPos);
      const distance = PIRATE_LOCATIONS[currentLocation];
      const nauticalMiles = distance?.[islandId] || 100;
      
      const bearing = calculateBearing(currentLocation, islandId);
      const sailingDays = calculateSailingTime(
        nauticalMiles,
        state.currentWinds.direction,
        state.currentWinds.speed,
        bearing,
        state.player.ship.speed
      );
      
      // Make sailing slower and more realistic (minimum 1 day, maximum based on distance)
      const adjustedSailingDays = Math.max(1, Math.ceil(sailingDays * 2));
      
      console.log(`Setting sail to ${islandId}: ${nauticalMiles}nm, ${adjustedSailingDays} days`);
      
      set({
        isSailing: true,
        sailingProgress: 0,
        sailingDuration: adjustedSailingDays,
        sailingDestination: islandId,
        sailingStartPosition: [...currentPos],
        sailingEndPosition: destPos,
        gameState: 'map' // Stay on map view during sailing
      });
    },

    updateSailing: (deltaTime: number) => {
      const state = get();
      if (!state.isSailing) return;
      
      // Progress sailing (slower, more realistic: 3 real seconds = 1 game day)
      const progressIncrement = deltaTime / (state.sailingDuration * 3);
      const newProgress = Math.min(1, state.sailingProgress + progressIncrement);
      
      // Interpolate ship position
      const startPos = state.sailingStartPosition;
      const endPos = state.sailingEndPosition;
      const currentPos: [number, number, number] = [
        startPos[0] + (endPos[0] - startPos[0]) * newProgress,
        startPos[1] + (endPos[1] - startPos[1]) * newProgress,
        startPos[2] + (endPos[2] - startPos[2]) * newProgress,
      ];
      
      // Update ship position
      set((state) => ({
        player: {
          ...state.player,
          ship: {
            ...state.player.ship,
            position: currentPos,
          },
        },
        sailingProgress: newProgress,
      }));
      
      // Advance time during sailing
      if (Math.floor(newProgress * state.sailingDuration) > Math.floor(state.sailingProgress * state.sailingDuration)) {
        const newDate = advanceDate(state.currentDate, 1);
        const newWinds = getHistoricalWinds(newDate);
        
        set({
          currentDate: newDate,
          currentWinds: newWinds,
        });
        
        // Update weather and time based on new date
        if (Math.random() < 0.3) get().updateWeather();
        if (Math.random() < 0.2) get().updateTimeOfDay();
      }
      
      // Complete sailing
      if (newProgress >= 1) {
        console.log(`Arrived at ${state.sailingDestination}!`);
        set({
          isSailing: false,
          sailingProgress: 0,
          sailingDuration: 0,
          sailingDestination: undefined,
        });
      }
    },
  }))
);

// Convert lat/lon to 3D world coordinates
function latLonTo3D(lat: number, lon: number): [number, number, number] {
  // Map latitude and longitude to 3D world space
  // Caribbean roughly spans 8°N to 32°N, -100°W to -55°W
  const x = ((lon + 77.5) * 20); // Center around -77.5°W (Caribbean center)
  const z = ((20 - lat) * 20); // Invert and center around 20°N
  return [x, 0, z];
}

// World positions based on real geographic coordinates
const WORLD_POSITIONS: { [key: string]: [number, number, number] } = {
  // Major Caribbean Pirate Havens
  'port_royal': latLonTo3D(17.93, -76.84),
  'tortuga': latLonTo3D(20.05, -72.78),
  'nassau': latLonTo3D(25.06, -77.35),
  'havana': latLonTo3D(23.13, -82.38),
  'port_au_prince': latLonTo3D(18.54, -72.34),
  'santo_domingo': latLonTo3D(18.47, -69.90),
  'san_juan': latLonTo3D(18.47, -66.11),
  'ile_a_vache': latLonTo3D(18.08, -73.69),
  
  // Lesser Antilles
  'martinique': latLonTo3D(14.60, -61.08),
  'barbados': latLonTo3D(13.10, -59.62),
  'trinidad': latLonTo3D(10.69, -61.22),
  'curacao': latLonTo3D(12.17, -69.00),
  'dominica': latLonTo3D(15.41, -61.37),
  'st_lucia': latLonTo3D(13.91, -60.98),
  'antigua': latLonTo3D(17.13, -61.85),
  'guadeloupe': latLonTo3D(16.24, -61.58),
  'st_thomas': latLonTo3D(18.34, -64.93),
  
  // Gulf of Mexico
  'new_orleans': latLonTo3D(29.95, -90.07),
  'mobile': latLonTo3D(30.69, -88.04),
  'pensacola': latLonTo3D(30.42, -87.22),
  'veracruz': latLonTo3D(19.20, -96.13),
  'campeche': latLonTo3D(19.85, -90.53),
  'tampico': latLonTo3D(22.23, -97.86),
  'galveston': latLonTo3D(29.30, -94.80),
  'barataria': latLonTo3D(29.67, -90.12),
  
  // North American Coast
  'charleston': latLonTo3D(32.78, -79.93),
  'st_augustine': latLonTo3D(29.90, -81.31),
  'key_west': latLonTo3D(24.56, -81.78),
  'tampa': latLonTo3D(27.95, -82.46),
  'savannah': latLonTo3D(32.08, -81.09),
  
  // Central American Coast
  'cartagena': latLonTo3D(10.39, -75.51),
  'panama_city': latLonTo3D(8.98, -79.52),
  'portobelo': latLonTo3D(9.55, -79.65),
  'santa_marta': latLonTo3D(11.24, -74.20),
  'maracaibo': latLonTo3D(10.67, -71.64),
  'belize_city': latLonTo3D(17.50, -88.20),
  
  // Central America Pacific
  'acapulco': latLonTo3D(16.86, -99.88),
  
  // Additional locations from map
  'miami': latLonTo3D(25.76, -80.19),
  'la_guaira': latLonTo3D(10.60, -66.93),
  'caracas': latLonTo3D(10.48, -66.90),
  'merida': latLonTo3D(20.97, -89.62),
  'cozumel': latLonTo3D(20.51, -86.95),
  'biloxi': latLonTo3D(30.40, -88.89),
  'wilmington': latLonTo3D(34.23, -77.95),
  'cape_hatteras': latLonTo3D(35.22, -75.52),
  'st_vincent': latLonTo3D(13.25, -61.19),
};

// Helper function to find current location based on position
function getCurrentLocationId(position: [number, number, number]): string {
  let closestLocation = 'port_royal';
  let closestDistance = Infinity;
  
  for (const [locationId, worldPos] of Object.entries(WORLD_POSITIONS)) {
    const distance = Math.sqrt(
      Math.pow(position[0] - worldPos[0], 2) +
      Math.pow(position[2] - worldPos[2], 2)
    );
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestLocation = locationId;
    }
  }
  
  return closestLocation;
}
