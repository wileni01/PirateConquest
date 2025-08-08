import { useEffect } from 'react';
import { usePirateGame } from '../lib/stores/usePirateGame';
import MapView from './MapView';

function StrategicMapOverlay() {
  const { isStrategicMapOverlayOpen, toggleStrategicMapOverlay, gameState } = usePirateGame();
  if (gameState !== 'sailing' && gameState !== 'combat') return null;

  // Hotkey: M to toggle map
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleStrategicMapOverlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleStrategicMapOverlay]);

  if (!isStrategicMapOverlayOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/70 z-40">
      <div className="absolute inset-0 overflow-auto">
        <MapView forceRender />
      </div>
      <button
        onClick={toggleStrategicMapOverlay}
        className="absolute top-4 right-4 bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded shadow"
      >
        Return to Battle (M)
      </button>
    </div>
  );
}

export default StrategicMapOverlay;


