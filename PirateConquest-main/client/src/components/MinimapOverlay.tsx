import { useEffect, useMemo } from 'react';
import { usePirateGame } from '../lib/stores/usePirateGame';
import { Card, CardContent } from './ui/card';

function MinimapOverlay() {
  const { player, ships, currentWinds, gameState } = usePirateGame();
  if (gameState !== 'sailing' && gameState !== 'combat') return null;

  const entities = useMemo(() => {
    return [
      { id: 'player', x: player.ship.position[0], z: player.ship.position[2], type: 'player' as const },
      ...ships.map(s => ({ id: s.id, x: s.position[0], z: s.position[2], type: s.isEnemy ? ('enemy' as const) : ('ally' as const) }))
    ];
  }, [player.ship.position, ships]);

  // Project world to minimap local space (simple relative box around player)
  const project = (x: number, z: number) => {
    const scale = 0.2; // meters to px
    const dx = x - player.ship.position[0];
    const dz = z - player.ship.position[2];
    return { px: 60 + dx * scale, pz: 60 + dz * scale };
  };

  const windArrowAngle = Math.atan2(
    Math.sin(currentWinds.direction * Math.PI / 180),
    Math.cos(currentWinds.direction * Math.PI / 180)
  );

  return (
    <div className="absolute bottom-4 left-4 pointer-events-none">
      <Card className="bg-black/80 border-amber-600 text-white pointer-events-auto">
        <CardContent className="p-2">
          <div className="relative" style={{ width: 120, height: 120 }}>
            <div className="absolute inset-0 rounded-md bg-blue-950/60 border border-amber-700" />
            {/* Entities */}
            {entities.map(e => {
              const p = project(e.x, e.z);
              return (
                <div
                  key={e.id}
                  className={`absolute rounded-full ${e.type === 'player' ? 'bg-amber-400' : e.type === 'enemy' ? 'bg-red-500' : 'bg-green-400'}`}
                  style={{ left: p.px, top: p.pz, width: 6, height: 6, transform: 'translate(-50%, -50%)' }}
                  title={e.id}
                />
              );
            })}
            {/* Wind arrow */}
            <div
              className="absolute left-2 top-2 text-xs text-amber-300"
              title={`Wind: ${currentWinds.speed}kt`}
            >
              💨
            </div>
            <div
              className="absolute right-2 top-2"
              style={{ transform: `rotate(${windArrowAngle}rad)` }}
              title="Wind direction"
            >
              <div className="w-4 h-0.5 bg-amber-400" />
              <div className="w-0 h-0 border-l-4 border-l-amber-400 border-y-4 border-y-transparent translate-x-4 -translate-y-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MinimapOverlay;



