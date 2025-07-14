import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { GameState, Ship, Port, Cannonball, GameMode } from "../types";
import { generateInitialPorts, createPlayerShip } from "../gameLogic";

interface PirateGameState extends GameState {
  gameState: GameMode;
  selectedPort?: Port;
  
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
}

const initialState: GameState = {
  player: {
    ship: createPlayerShip(),
    gold: 1000,
    reputation: 0,
    supplies: {
      food: 50,
      rum: 30,
      ammunition: 100,
    },
    fleet: [],
  },
  ships: [],
  ports: generateInitialPorts(),
  cannonballs: [],
  currentPort: undefined,
};

export const usePirateGame = create<PirateGameState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    gameState: 'menu',
    selectedPort: undefined,

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
              
              // Add gold and reputation for destroying enemy ships
              if (ball.shooterId === state.player.ship.id && ship.isEnemy) {
                set((state) => ({
                  player: {
                    ...state.player,
                    gold: state.player.gold + 200,
                    reputation: state.player.reputation + 10,
                  },
                }));
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
  }))
);
