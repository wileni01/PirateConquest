import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { GameState, Ship, Port, Cannonball, GameMode, Mission } from "../types";
import { generateInitialPorts, createPlayerShip } from "../gameLogic";
import { GameDate, WindData, getHistoricalWinds, calculateSailingTime, calculateBearing, PIRATE_LOCATIONS, advanceDate } from "../windSystem";
import { toast } from "sonner";

interface PirateGameState extends GameState {
  gameState: GameMode;
  // Presentation/UI flags (non-gameplay)
  cameraMode: 'follow' | 'tactical';
  isStrategicMapOverlayOpen: boolean;
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
  setCameraMode: (mode: 'follow' | 'tactical') => void;
  toggleStrategicMapOverlay: () => void;
   saveGame: () => void;
   loadGame: () => void;
  updatePlayerPosition: (position: [number, number, number], rotation: number) => void;
    fireCannonball: (shipId: string, direction: [number, number, number]) => void;
    fireBroadside: (shipId: string, side: 'port' | 'starboard') => void;
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
   applyDailyUpkeep: () => void;
  buyGoods: (goodId: string, quantity: number, price: number) => void;
  sellGoods: (goodId: string, quantity: number) => void;
  repairShip: () => void;
  buyShip: (shipType: string) => void;
  sellShip: (shipId: string) => void;
  acceptMission: (mission: Mission) => void;
   completeMission: (missionId: string, success?: boolean) => void;
   purchaseLetterOfMarque: (faction: 'spanish' | 'english' | 'french' | 'dutch' | 'danish') => void;
   dividePlunder: () => void;
   bribeGovernor: (amount: number) => void;
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
    cargo: {
      current: 20,
      max: 100,
      goods: [
        { id: 'rum', name: 'Rum', quantity: 10 },
        { id: 'sugar', name: 'Sugar', quantity: 10 }
      ],
    },
  },
  ships: [],
  ports: generateInitialPorts(),
  cannonballs: [],
  currentPort: undefined,
  weather: 'clear',
  timeOfDay: 'day',
  activeMissions: [],
  lettersOfMarque: [],
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
    cameraMode: 'tactical',
    isStrategicMapOverlayOpen: false,

    startGame: () => {
      console.log("Starting pirate adventure!");
      const state = get();
      // Start near current port: place player a short distance off the harbor
      const port = state.currentPort || state.ports[0];
      const pos: [number, number, number] = [
        port.position[0] + 8,
        0,
        port.position[2] + 8,
      ];
      set((s) => ({
        gameState: 'sailing',
        player: {
          ...s.player,
          ship: { ...s.player.ship, position: pos, rotation: Math.atan2(1,1) },
        },
      }));
    },

    setGameState: (gameState: GameMode) => {
      set({ gameState });
    },

    setCameraMode: (mode: 'follow' | 'tactical') => {
      set({ cameraMode: mode });
    },

    toggleStrategicMapOverlay: () => {
      set((state) => ({ isStrategicMapOverlayOpen: !state.isStrategicMapOverlayOpen }));
    },

    saveGame: () => {
      const state = get();
      try {
        const serializable = {
          ...state,
          // functions removed implicitly; also avoid circular refs
          // Ensure dates are serialized
          player: {
            ...state.player,
            buriedTreasure: state.player.buriedTreasure.map(t => ({
              ...t,
              buried: t.buried instanceof Date ? t.buried.toISOString() : t.buried,
            })),
          },
        } as any;
        localStorage.setItem('pirate_save', JSON.stringify(serializable));
        console.log('Game saved');
        toast.success('Game saved');
      } catch (e) {
        console.warn('Save failed', e);
        toast.error('Save failed');
      }
    },

    loadGame: () => {
      try {
        const raw = localStorage.getItem('pirate_save');
        if (!raw) return;
        const data = JSON.parse(raw);
        // Hydrate any dates
        if (data?.player?.buriedTreasure) {
          data.player.buriedTreasure = data.player.buriedTreasure.map((t: any) => ({
            ...t,
            buried: new Date(t.buried),
          }));
        }
        set(data);
        console.log('Game loaded');
        toast.success('Game loaded');
      } catch (e) {
        console.warn('Load failed', e);
        toast.error('Load failed');
      }
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
        position: [
          ship.position[0] + Math.sin(ship.rotation) * 3,
          ship.position[1] + 1,
          ship.position[2] + Math.cos(ship.rotation) * 3,
        ],
        velocity: [direction[0] * 18, 0, direction[2] * 18],
        damage: 18,
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

    fireBroadside: (shipId: string, side: 'port' | 'starboard') => {
      const state = get();
      const ship = shipId === state.player.ship.id 
        ? state.player.ship 
        : state.ships.find(s => s.id === shipId);

      if (!ship) return;
      const now = Date.now();
      const cooldownMs = 5000; // slower reload for broadsides
      const lastSideTime = side === 'port' ? (ship.lastFiredPort || 0) : (ship.lastFiredStarboard || 0);
      if (now - lastSideTime < cooldownMs) return;

      // Ammunition check: each broadside fires half the cannons
      const numShots = Math.max(1, Math.floor((ship.cannons / 2)));
      const ammoNeeded = numShots;
      if (shipId === state.player.ship.id && state.player.supplies.ammunition < ammoNeeded) {
        return;
      }

      const sideAngle = side === 'port' ? -Math.PI / 2 : Math.PI / 2;
      const baseAngle = ship.rotation + sideAngle;
      const spread = 0.12; // slight spread between cannons

      const newBalls: Cannonball[] = [];
      for (let i = 0; i < numShots; i++) {
        const angle = baseAngle + (i - (numShots - 1) / 2) * spread;
        const dir: [number, number, number] = [Math.sin(angle), 0, Math.cos(angle)];
        const lateralOffset = side === 'port' ? -1.2 : 1.2;
        const alongOffset = 1 - i * 0.8;
        const worldOffsetX = Math.sin(ship.rotation) * alongOffset + Math.cos(ship.rotation) * lateralOffset;
        const worldOffsetZ = Math.cos(ship.rotation) * alongOffset - Math.sin(ship.rotation) * lateralOffset;
        newBalls.push({
          id: `broadside_${now}_${i}_${Math.random()}`,
          position: [ship.position[0] + worldOffsetX, ship.position[1] + 0.5, ship.position[2] + worldOffsetZ],
          velocity: [dir[0] * 16, 0, dir[2] * 16],
          damage: 12,
          shooterId: shipId,
          createdAt: now,
        });
      }

      set((state) => {
        const newState = { ...state } as any;
        newState.cannonballs = [...state.cannonballs, ...newBalls];
        if (shipId === state.player.ship.id) {
          newState.player = {
            ...state.player,
            supplies: {
              ...state.player.supplies,
              ammunition: Math.max(0, state.player.supplies.ammunition - ammoNeeded),
            },
            ship: {
              ...state.player.ship,
              [side === 'port' ? 'lastFiredPort' : 'lastFiredStarboard']: now,
            },
          };
        } else {
          newState.ships = state.ships.map(s => s.id === shipId ? {
            ...s,
            [side === 'port' ? 'lastFiredPort' : 'lastFiredStarboard']: now,
          } : s);
        }
        return newState;
      });
    },

    updateCannonballs: (deltaTime: number) => {
      set((state) => ({
        cannonballs: state.cannonballs
          .map(ball => ({
            ...ball,
            position: [
              ball.position[0] + ball.velocity[0] * deltaTime,
              Math.max(0, ball.position[1] - 0.8 * deltaTime),
              ball.position[2] + ball.velocity[2] * deltaTime,
            ] as [number, number, number],
          }))
          .filter(ball => {
            const age = Date.now() - ball.createdAt;
            const distance = Math.sqrt(ball.position[0] ** 2 + ball.position[2] ** 2);
            // remove if below water (y==0) for > 0.3s or too old/far
            const fellInWater = ball.position[1] <= 0 && age > 300;
            return age < 5000 && distance < 220 && !fellInWater;
          }),
      }));
    },

    checkCollisions: () => {
      const snapshot = get();
      snapshot.cannonballs.forEach(ball => {
        // Check collision with player ship
        if (ball.shooterId !== snapshot.player.ship.id) {
          const playerShip = snapshot.player.ship;
          const distance = Math.hypot(
            ball.position[0] - playerShip.position[0],
            ball.position[2] - playerShip.position[2]
          );
          if (distance < 2) {
            set((state) => ({
              player: {
                ...state.player,
                ship: {
                  ...state.player.ship,
                  health: Math.max(0, state.player.ship.health - ball.damage),
                  lastHitAt: Date.now(),
                },
              },
              cannonballs: state.cannonballs.filter(b => b.id !== ball.id),
            }));
          }
        }

        // Check collision with other ships
        snapshot.ships.forEach(hitShip => {
          if (ball.shooterId === hitShip.id) return;
          const distance = Math.hypot(
            ball.position[0] - hitShip.position[0],
            ball.position[2] - hitShip.position[2]
          );
          if (distance < 2) {
            const newHealth = Math.max(0, hitShip.health - ball.damage);
            set((state) => {
              const updatedShips = state.ships
                .map(s => s.id === hitShip.id ? { ...s, health: newHealth, lastHitAt: Date.now() } : s)
                .filter(s => s.health > 0);

              let updatedPlayer = state.player;
              if (ball.shooterId === state.player.ship.id && hitShip.isEnemy && newHealth <= 0) {
                const loot = hitShip.cargo;
                const targetFaction = hitShip.faction;
                const hasMarque = (state.lettersOfMarque || []).includes(targetFaction as any);
                const repDelta = hasMarque ? 8 : -5;
                const infamyDelta = hasMarque ? 3 : 10;
                updatedPlayer = {
                  ...state.player,
                  gold: state.player.gold + 200,
                  reputation: state.player.reputation + repDelta,
                  infamy: state.player.infamy + infamyDelta,
                  supplies: {
                    food: state.player.supplies.food + loot.food,
                    rum: state.player.supplies.rum + loot.rum,
                    ammunition: state.player.supplies.ammunition + loot.ammunition,
                  },
                  ship: {
                    ...state.player.ship,
                    cargo: {
                      ...state.player.ship.cargo,
                      treasure: state.player.ship.cargo.treasure + loot.treasure,
                    },
                  },
                };
              }

              // Cinematic callouts (non-gameplay)
              if (ball.shooterId === state.player.ship.id && hitShip.isEnemy) {
                const before = hitShip.health / hitShip.maxHealth;
                const after = newHealth / hitShip.maxHealth;
                if (before > 0.7 && after <= 0.7) toast.message('Enemy hull struck!');
                if (before > 0.4 && after <= 0.4) toast.message('Enemy taking on water!');
                if (before > 0.1 && after <= 0.1) toast.message('Enemy ship ablaze!');
              }

              return {
                ships: updatedShips,
                cannonballs: state.cannonballs.filter(b => b.id !== ball.id),
                player: updatedPlayer,
              } as any;
            });
          }
        });
      });
    },

    enterPort: (portId: string) => {
      const state = get();
      let port = state.ports.find(p => p.id === portId);
      
      // If port not found by ID, try to find by name matching
      if (!port) {
        // Create a basic port structure from the Caribbean location
        const portData: Port = {
          id: portId,
          name: portId.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          position: [0, 0, 0] as [number, number, number],
          supplies: { food: 100, rum: 50, ammunition: 200, treasure: 0 },
          prices: { food: 10, rum: 25, ammunition: 5 },
          governor: { name: 'Governor Smith', attitude: 'neutral' as const, bribes: 100 },
          fortification: 5,
          garrison: 200,
          faction: 'neutral' as const,
          type: 'port' as const
        };
        port = portData;
        
        // Add this port to the ports array
        set((state) => ({
          ports: [...state.ports, portData]
        }));
      }
      
      if (port) {
        console.log(`Entering port: ${port.name}`);
        // Complete delivery missions that target this port
        const toComplete = (state.activeMissions || []).filter(m => m.type === 'delivery' && m.targetPortId === port.id && m.status === 'active');
        if (toComplete.length > 0) {
          toComplete.forEach(m => get().completeMission(m.id, true));
        }
        set({ 
          currentPort: port,
          selectedPort: port,
          gameState: 'port' 
        });
        // Autosave on port entry
        get().saveGame();
      }
    },

    exitPort: () => {
      console.log("Leaving port");
      set({ 
        currentPort: undefined,
        selectedPort: undefined,
        gameState: 'sailing' 
      });
      // Autosave on departure
      get().saveGame();
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
      const available = state.player.ship.cargo.treasure;
      const toSell = Math.max(0, Math.min(amount, available));
      if (toSell <= 0) return;
      const value = toSell * 10; // 10 gold per treasure
      set((state) => ({
        player: {
          ...state.player,
          gold: state.player.gold + value,
          ship: {
            ...state.player.ship,
            cargo: {
              ...state.player.ship.cargo,
              treasure: Math.max(0, state.player.ship.cargo.treasure - toSell),
            },
          },
        },
      }));
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
          const lowMorale = ship.morale < 25 || ship.health < ship.maxHealth * 0.3;
          const wantsToFlee = lowMorale && distance < 25;
          
          if (wantsToFlee) {
            // Flee from player
            const moveSpeed = ship.speed * deltaTime * 1.2;
            const dirX = -dx / Math.max(distance, 0.001);
            const dirZ = -dz / Math.max(distance, 0.001);
            return {
              ...ship,
              position: [
                ship.position[0] + dirX * moveSpeed,
                ship.position[1],
                ship.position[2] + dirZ * moveSpeed,
              ] as [number, number, number],
              rotation: Math.atan2(dirX, dirZ),
              morale: Math.max(0, ship.morale - 0.1),
            };
          }

          if (distance > 24) {
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
          } else if (distance <= 24 && distance >= 12) {
            // AI attempts to align for broadside
            const angleToPlayer = Math.atan2(dx, dz);
            const desired = angleToPlayer + Math.PI / 2; // try to bring player to starboard
            const turn = Math.atan2(Math.sin(desired - ship.rotation), Math.cos(desired - ship.rotation));
            const turnSpeed = 1.5 * deltaTime;
            const newRot = ship.rotation + Math.max(-turnSpeed, Math.min(turnSpeed, turn));
            const now = Date.now();
            const canPort = now - (ship.lastFiredPort || 0) > 5000;
            const canStar = now - (ship.lastFiredStarboard || 0) > 5000;
            const deltaAngle = Math.atan2(Math.sin(angleToPlayer - ship.rotation), Math.cos(angleToPlayer - ship.rotation));
            const playerOnStarboard = deltaAngle > 0; // right side
            const shouldFire = Math.abs(Math.abs(deltaAngle) - Math.PI / 2) < 0.35;
            if (shouldFire) {
              if (playerOnStarboard && canStar) get().fireBroadside(ship.id, 'starboard');
              if (!playerOnStarboard && canPort) get().fireBroadside(ship.id, 'port');
            }
            return { ...ship, rotation: newRot };
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
        
        const targetFaction = enemyShip.faction;
        const hasMarque = (state.lettersOfMarque || []).includes(targetFaction as any);
        if (playerCombatPower > enemyCombatPower) {
          // Victory! Capture the ship
          const capturedShip = { ...enemyShip, isEnemy: false };
          
          set((state) => ({
            ships: state.ships.filter(s => s.id !== shipId),
            player: {
              ...state.player,
              capturedShips: [...state.player.capturedShips, capturedShip],
              gold: state.player.gold + 100,
              reputation: state.player.reputation + (hasMarque ? 12 : -8),
              infamy: state.player.infamy + (hasMarque ? 5 : 15),
              supplies: {
                food: state.player.supplies.food + enemyShip.cargo.food,
                rum: state.player.supplies.rum + enemyShip.cargo.rum,
                ammunition: state.player.supplies.ammunition + enemyShip.cargo.ammunition,
              },
              ship: {
                ...state.player.ship,
                cargo: {
                  ...state.player.ship.cargo,
                  treasure: state.player.ship.cargo.treasure + enemyShip.cargo.treasure,
                },
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
      if (times[nextIndex] === 'dawn') {
        // Apply daily upkeep at dawn
        get().applyDailyUpkeep();
      }
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
    
    buyGoods: (goodId: string, quantity: number, price: number) => {
      set((state) => {
        const totalCost = price * quantity;
        if (state.player.gold < totalCost) return state;
        
        const existingGood = state.player.cargo.goods.find(g => g.id === goodId);
        const newCargoAmount = state.player.cargo.current + quantity;
        
        if (newCargoAmount > state.player.cargo.max) return state;
        
        const updatedGoods = existingGood
          ? state.player.cargo.goods.map(g => 
              g.id === goodId 
                ? { ...g, quantity: g.quantity + quantity }
                : g
            )
          : [...state.player.cargo.goods, { id: goodId, name: goodId, quantity }];
        
        return {
          player: {
            ...state.player,
            gold: state.player.gold - totalCost,
            cargo: {
              ...state.player.cargo,
              current: newCargoAmount,
              goods: updatedGoods
            }
          }
        };
      });
    },
    
    sellGoods: (goodId: string, quantity: number) => {
      set((state) => {
        const good = state.player.cargo.goods.find(g => g.id === goodId);
        if (!good || good.quantity < quantity) return state;
        
        const basePrice = 20; // Base price per unit
        const totalRevenue = basePrice * quantity * 0.9; // 90% of base price when selling
        
        const updatedGoods = good.quantity === quantity
          ? state.player.cargo.goods.filter(g => g.id !== goodId)
          : state.player.cargo.goods.map(g => 
              g.id === goodId 
                ? { ...g, quantity: g.quantity - quantity }
                : g
            );
        
        return {
          player: {
            ...state.player,
            gold: state.player.gold + totalRevenue,
            cargo: {
              ...state.player.cargo,
              current: state.player.cargo.current - quantity,
              goods: updatedGoods
            }
          }
        };
      });
    },
    
    repairShip: () => {
      set((state) => {
        const damage = state.player.ship.maxHealth - state.player.ship.health;
        const repairCost = Math.round(damage * 2);
        
        if (state.player.gold < repairCost) return state;
        
        return {
          player: {
            ...state.player,
            gold: state.player.gold - repairCost,
            ship: {
              ...state.player.ship,
              health: state.player.ship.maxHealth
            }
          }
        };
      });
    },
    
    buyShip: (shipType: string) => {
      set((state) => {
        const catalog: Record<string, { price: number; crew: number; maxCrew: number; cannons: number; speed: number; maxHealth: number; cargoMax: number; type: Ship['type'] }> = {
          sloop: { price: 5000, crew: 20, maxCrew: 40, cannons: 8, speed: 9, maxHealth: 250, cargoMax: 100, type: 'sloop' },
          brigantine: { price: 12000, crew: 50, maxCrew: 80, cannons: 16, speed: 7, maxHealth: 400, cargoMax: 160, type: 'brigantine' },
          frigate: { price: 25000, crew: 150, maxCrew: 220, cannons: 32, speed: 6, maxHealth: 700, cargoMax: 240, type: 'frigate' },
          galleon: { price: 50000, crew: 300, maxCrew: 420, cannons: 48, speed: 4, maxHealth: 1000, cargoMax: 400, type: 'galleon' },
        } as const;
        const spec = catalog[shipType];
        if (!spec) return state;
        if (state.player.gold < spec.price) return state;
        const oldShip = state.player.ship;
        const newShip: Ship = {
          id: 'player',
          position: [...oldShip.position] as [number, number, number],
          rotation: oldShip.rotation,
          health: spec.maxHealth,
          maxHealth: spec.maxHealth,
          crew: Math.min(spec.crew, spec.maxCrew),
          maxCrew: spec.maxCrew,
          cannons: spec.cannons,
          speed: spec.speed,
          isPlayer: true,
          type: spec.type,
          isEnemy: false,
          lastFired: 0,
          lastFiredPort: 0,
          lastFiredStarboard: 0,
          morale: Math.min(oldShip.morale, 80),
          maxMorale: oldShip.maxMorale,
          faction: oldShip.faction,
          cargo: { ...oldShip.cargo },
          maxCargo: spec.cargoMax,
        };
        const newCargoMax = spec.cargoMax;
        const adjustedCurrent = Math.min(state.player.cargo.current, newCargoMax);
        toast.success(`Purchased ${shipType} for ${spec.price} gold`);
        return {
          player: {
            ...state.player,
            gold: state.player.gold - spec.price,
            ship: newShip,
            cargo: {
              ...state.player.cargo,
              max: newCargoMax,
              current: adjustedCurrent,
            },
          },
        } as any;
      });
    },
    
    sellShip: (shipId: string) => {
      set((state) => {
        const ship = state.player.capturedShips.find(s => s.id === shipId);
        if (!ship) return state;
        // Simple valuation: base on cannons, health, size
        const baseValue = 500 + ship.cannons * 100 + (ship.maxHealth / 2);
        toast.success(`Prize sold for ${Math.round(baseValue)} gold`);
        return {
          player: {
            ...state.player,
            gold: state.player.gold + Math.round(baseValue),
            capturedShips: state.player.capturedShips.filter(s => s.id !== shipId),
            reputation: state.player.reputation + 5,
          }
        };
      });
      get().saveGame();
    },
    
    acceptMission: (mission: Mission) => {
      console.log('Accepting mission:', mission.id);
      set((state) => ({
        activeMissions: [...(state.activeMissions || []), mission],
        player: { ...state.player, reputation: state.player.reputation + 2 },
      }));
      get().saveGame();
      toast.success(`Mission accepted: ${mission.title}`);
    },

    completeMission: (missionId: string, success: boolean = true) => {
      const state = get();
      const mission = state.activeMissions?.find(m => m.id === missionId);
      if (!mission) return;
      set((state) => ({
        activeMissions: state.activeMissions?.map(m => m.id === missionId ? { ...m, status: success ? 'completed' : 'failed' } : m) || [],
        player: success ? {
          ...state.player,
          gold: state.player.gold + mission.reward,
          reputation: state.player.reputation + (mission.type === 'combat' ? 12 : 8),
        } : state.player,
      }));
      toast[success ? 'success' : 'error'](`Mission ${success ? 'completed' : 'failed'}: ${mission.title}${success ? ` (+${mission.reward}g)` : ''}`);
    },

    purchaseLetterOfMarque: (faction) => {
      set((state) => {
        const cost = 1000; // base cost; could vary by faction/rep later
        if (state.player.gold < cost) return state;
        const current = new Set(state.lettersOfMarque || []);
        current.add(faction);
        toast.success(`Letter of Marque purchased for ${faction}`);
        return {
          player: { ...state.player, gold: state.player.gold - cost },
          lettersOfMarque: Array.from(current),
        } as any;
      });
    },

    dividePlunder: () => {
      // Pay crew wages, reset morale, reduce infamy slightly
      set((state) => {
        const crewCount = state.player.ship.crew;
        const wages = crewCount * 5; // 5 gold per crew
        const canPay = state.player.gold >= wages;
        toast.success(`Divided the plunder. Wages paid: ${wages}g`);
        return {
          player: {
            ...state.player,
            gold: Math.max(0, state.player.gold - wages),
            ship: {
              ...state.player.ship,
              morale: canPay ? Math.min(state.player.ship.maxMorale, state.player.ship.morale + 30) : state.player.ship.morale,
            },
            reputation: state.player.reputation + (canPay ? 5 : 0),
            infamy: Math.max(0, state.player.infamy - 5),
          },
        };
      });
    },

    bribeGovernor: (amount: number) => {
      set((state) => {
        if (!state.currentPort || state.player.gold < amount) return state;
        toast.success(`Bribed governor (${state.currentPort.name}) for ${amount}g`);
        return {
          player: { ...state.player, gold: state.player.gold - amount },
          ports: state.ports.map(p => p.id === state.currentPort?.id ? { ...p, governor: { ...p.governor, attitude: 'neutral' } } : p),
          currentPort: { ...state.currentPort, governor: { ...state.currentPort.governor, attitude: 'neutral' } },
        } as any;
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

    applyDailyUpkeep: () => {
      set((state) => {
        const crew = state.player.ship.crew;
        const foodConsumed = Math.ceil(crew / 5);
        const rumConsumed = Math.ceil(crew / 10);
        const hasRations = state.player.supplies.food >= foodConsumed;
        const hasRum = state.player.supplies.rum >= rumConsumed;

        const moraleDelta = (hasRations ? 2 : -5) + (hasRum ? 1 : 0);

        const newMorale = Math.max(0, Math.min(state.player.ship.maxMorale, state.player.ship.morale + moraleDelta));
        const mutiny = newMorale <= 5 && Math.random() < 0.05; // 5% daily if morale critically low

        const shipAfterMutiny = mutiny
          ? { ...state.player.ship, morale: 20, crew: Math.max(1, state.player.ship.crew - Math.ceil(state.player.ship.crew * 0.1)) }
          : { ...state.player.ship, morale: newMorale };

        return {
          player: {
            ...state.player,
            supplies: {
              ...state.player.supplies,
              food: Math.max(0, state.player.supplies.food - foodConsumed),
              rum: Math.max(0, state.player.supplies.rum - rumConsumed),
            },
            ship: shipAfterMutiny,
          },
        };
      });
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
