import React, { useState, useCallback, useRef, useEffect } from 'react';
import { usePirateGame } from '../lib/stores/usePirateGame';
import { format } from 'date-fns';
import { ChevronLeft, Compass, Flag, Map, X, Anchor, Home, Navigation, Wind, Zap, Calendar, Sunrise, Sunset, Cloud, Sun, Moon, CloudFog, CloudRain, Users, Coins, Heart, Shield } from 'lucide-react';
import { formatDate, getWindDescription } from '../lib/windSystem';
import { Card } from './ui/card';
import { CARIBBEAN_LOCATIONS } from "../lib/caribbeanLocations";

// Realistic geographic bounds for the Caribbean
const CARIBBEAN_BOUNDS = {
  north: 32.5,   // Florida Keys
  south: 8,     // Panama/Venezuela
  west: -100,   // Gulf of Mexico
  east: -55     // Lesser Antilles
};

// Temporary placeholder for map bounds
let mapBounds = {
  north: 32,
  south: 8,
  west: -98,
  east: -58
};

// Convert real lat/lon to map coordinates with better scaling
const latLonToMapCoords = (lat: number, lon: number, mapWidth: number = 100, mapHeight: number = 70) => {
  // Use calculated bounds centered on port locations
  const { north, south, west, east } = mapBounds;
  
  // Add 5% margin to prevent ports from being at the very edge
  const margin = 0.05;
  const x = margin * mapWidth + ((lon - west) / (east - west)) * mapWidth * (1 - 2 * margin);
  const y = margin * mapHeight + ((north - lat) / (north - south)) * mapHeight * (1 - 2 * margin);
  
  return { x: Math.max(0, Math.min(mapWidth, x)), y: Math.max(0, Math.min(mapHeight, y)) };
};

// Calculate the centroid and optimal bounds after locations are defined
const calculateCentroid = () => {
  // Include all locations for proper coverage
  const lats = CARIBBEAN_LOCATIONS.map(loc => loc.lat);
  const lons = CARIBBEAN_LOCATIONS.map(loc => loc.lon);
  
  const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
  const avgLon = lons.reduce((a, b) => a + b, 0) / lons.length;
  
  // Calculate the range needed with moderate padding
  const latRange = Math.max(...lats) - Math.min(...lats);
  const lonRange = Math.max(...lons) - Math.min(...lons);
  
  // Moderate padding to show all ports with some breathing room
  const padding = 0.08;
  
  return {
    center: { lat: avgLat, lon: avgLon },
    bounds: {
      north: Math.max(...lats) + (latRange * padding),
      south: Math.min(...lats) - (latRange * padding),
      west: Math.min(...lons) - (lonRange * padding),
      east: Math.max(...lons) + (lonRange * padding)
    }
  };
};

// Update map bounds based on centroid calculation
const centroidConfig = calculateCentroid();
mapBounds = centroidConfig.bounds;

// Function to detect label collisions and adjust positions
const adjustLabelPositions = (locations: typeof CARIBBEAN_LOCATIONS) => {
  // First, map locations with their base positions
  const locationsWithCoords = locations.map(location => ({
    ...location,
    ...latLonToMapCoords(location.lat, location.lon),
    labelOffsetX: 0,
    labelOffsetY: 5,
    useLeaderLine: false
  }));

  // Sort by Y position to process from top to bottom
  locationsWithCoords.sort((a, b) => a.y - b.y);

  // Check for overlaps and adjust positions
  for (let i = 0; i < locationsWithCoords.length; i++) {
    const current = locationsWithCoords[i];
    
    // Check against all previous labels
    for (let j = 0; j < i; j++) {
      const other = locationsWithCoords[j];
      
      // Calculate if labels overlap (considering text width estimation)
      const textWidthEstimate = current.name.length * 1.5;
      const otherTextWidth = other.name.length * 1.5;
      
      const horizontalOverlap = Math.abs(current.x - other.x) < (textWidthEstimate + otherTextWidth) / 2;
      const verticalOverlap = Math.abs(current.y - other.y) < 6;
      
      if (horizontalOverlap && verticalOverlap) {
        // Try different positions
        const positions = [
          { x: 15, y: 0 },   // Right
          { x: -15, y: 0 },  // Left
          { x: 0, y: -10 },  // Top
          { x: 0, y: 10 },   // Bottom
          { x: 10, y: -8 },  // Top-right
          { x: -10, y: -8 }, // Top-left
          { x: 10, y: 8 },   // Bottom-right
          { x: -10, y: 8 },  // Bottom-left
        ];
        
        // Find the best position
        let bestPosition = positions[0];
        let minOverlap = Infinity;
        
        for (const pos of positions) {
          let overlap = 0;
          for (let k = 0; k < i; k++) {
            const testOther = locationsWithCoords[k];
            const newX = current.x + pos.x;
            const newY = current.y + pos.y;
            const dist = Math.sqrt(Math.pow(newX - testOther.x, 2) + Math.pow(newY - testOther.y, 2));
            if (dist < 10) {
              overlap += (10 - dist);
            }
          }
          
          if (overlap < minOverlap) {
            minOverlap = overlap;
            bestPosition = pos;
          }
        }
        
        current.labelOffsetX = bestPosition.x;
        current.labelOffsetY = bestPosition.y;
        
        // Use leader line for labels that are offset significantly
        if (Math.abs(bestPosition.x) > 10 || Math.abs(bestPosition.y) > 8) {
          current.useLeaderLine = true;
        }
      }
    }
  }
  
  return locationsWithCoords;
};

const portTypeStyles = {
  major_port: { radius: 5, strokeWidth: 2 },
  port: { radius: 4, strokeWidth: 1.5 },
  pirate_haven: { radius: 4.5, strokeWidth: 2 },
  treasure_port: { radius: 5, strokeWidth: 2.5 },
  island: { radius: 3, strokeWidth: 1 }
};

const factionColors = {
  spanish: '#dc2626',
  english: '#2563eb',
  french: '#7c3aed',
  dutch: '#ea580c',
  pirate: '#000000',
  neutral: '#6b7280',
  danish: '#0891b2'
};

const getFactionSymbol = (faction: string) => {
  switch (faction) {
    case 'spanish': return '♔';
    case 'english': return '♕';
    case 'french': return '⚜';
    case 'dutch': return '▲';
    case 'pirate': return '☠';
    case 'danish': return '✦';
    default: return '○';
  }
};

export function MapView() {
  const { 
    setGameState, 
    ports, 
    currentDate, 
    currentWinds,
    weather,
    timeOfDay,
    sailToIsland,
    player,
    gameState
  } = usePirateGame();
  
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showLandMasses, setShowLandMasses] = useState(true);
  const mapRef = useRef<SVGSVGElement>(null);
  const [mapScale, setMapScale] = useState(1);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [showLegend, setShowLegend] = useState(true);
  
  // Adjust positions to prevent overlap
  const adjustedLocations = adjustLabelPositions(CARIBBEAN_LOCATIONS);

  // Convert player's 3D position to lat/lon
  const getPlayerLatLon = () => {
    // Find the closest location to determine approximate lat/lon
    // This is a simplified approach - in reality we'd need proper conversion
    let closestLocation = CARIBBEAN_LOCATIONS[0];
    let closestDistance = Infinity;
    
    // First, try to find if player is at a known port
    const playerPort = ports.find(p => 
      Math.abs(p.position[0] - player.ship.position[0]) < 0.1 && 
      Math.abs(p.position[2] - player.ship.position[2]) < 0.1
    );
    
    if (playerPort) {
      // Find the matching location in CARIBBEAN_LOCATIONS
      const matchingLocation = CARIBBEAN_LOCATIONS.find(loc => loc.id === playerPort.id);
      if (matchingLocation) {
        return { lat: matchingLocation.lat, lon: matchingLocation.lon };
      }
    }
    
    // If not at a port, estimate position based on interpolation
    // For now, use Port Royal as default (this would need proper interpolation in a real game)
    const portRoyal = CARIBBEAN_LOCATIONS.find(loc => loc.id === 'port_royal');
    return { lat: portRoyal?.lat || 17.94, lon: portRoyal?.lon || -76.84 };
  };

  const playerLatLon = getPlayerLatLon();
  const playerMapCoords = latLonToMapCoords(playerLatLon.lat, playerLatLon.lon);

  // Handle location selection for sailing
  const handleLocationClick = (location: any) => {
    const playerPort = ports.find(p => p.position[0] === player.ship.position[0] && p.position[2] === player.ship.position[2]);
    const isAtThisLocation = playerPort?.id === location.id;
    
    setSelectedLocation({
      ...location,
      isPlayerLocation: isAtThisLocation,
      canSailTo: !isAtThisLocation
    });
  };

  const handleSailToLocation = () => {
    if (selectedLocation && selectedLocation.canSailTo) {
      sailToIsland(selectedLocation.id);
      setSelectedLocation(null);
    }
  };

  // Pan and zoom controls
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setMapScale(prev => Math.max(0.5, Math.min(3, prev * delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setMapPan(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastMousePos]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = () => {
    setMapScale(1);
    setMapPan({ x: 0, y: 0 });
  };

  // Add keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'g' || e.key === 'G') {
        setShowGrid(prev => !prev);
      }
      if (e.key === 'l' || e.key === 'L') {
        setShowLandMasses(prev => !prev);
      }
      if (e.key === 'r' || e.key === 'R') {
        resetView();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  // Weather icons
  const getWeatherIcon = () => {
    switch (weather) {
      case 'storm': return <CloudRain className="w-4 h-4" />;
      case 'fog': return <CloudFog className="w-4 h-4" />;
      default: return <Sun className="w-4 h-4" />;
    }
  };

  // Time of day icons
  const getTimeIcon = () => {
    switch (timeOfDay) {
      case 'dawn': return <Sunrise className="w-4 h-4" />;
      case 'dusk': return <Sunset className="w-4 h-4" />;
      case 'night': return <Moon className="w-4 h-4" />;
      default: return <Sun className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-cyan-100 to-blue-200">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-900/90 to-slate-800/80 text-white p-4 z-20 backdrop-blur-sm">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setGameState('sailing')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Sailing
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Map className="w-6 h-6" />
              Caribbean Map
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Date and Time */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(currentDate)}</span>
              {getTimeIcon()}
              <span className="capitalize">{timeOfDay}</span>
            </div>
            
            {/* Weather */}
            <div className="flex items-center gap-2 text-sm">
              {getWeatherIcon()}
              <span className="capitalize">{weather}</span>
            </div>
            
            {/* Wind */}
            <div className="flex items-center gap-2 text-sm">
              <Wind className="w-4 h-4" />
              <span>{getWindDescription(currentWinds)}</span>
            </div>
            
            {/* Player Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span>{player.gold}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-blue-400" />
                <span>{player.ship.crew}/{player.ship.maxCrew}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-400" />
                <span>{player.ship.health}/{player.ship.maxHealth}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="absolute inset-0 pt-20 pb-4">
        <div className="relative w-full h-full flex items-center justify-center">
          <svg
            ref={mapRef}
            viewBox="0 0 100 70"
            className="w-full h-full max-w-6xl cursor-move"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              transform: `translate(${mapPan.x}px, ${mapPan.y}px) scale(${mapScale})`,
              transition: isPanning ? 'none' : 'transform 0.3s ease-out'
            }}
          >
            <defs>
              {/* Define patterns for different terrains */}
              <pattern id="landPattern" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                <rect width="4" height="4" fill="#8b7355" />
                <circle cx="2" cy="2" r="0.5" fill="#7a6144" opacity="0.3" />
              </pattern>
              
              <pattern id="shallowWaterPattern" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
                <rect width="3" height="3" fill="#4FC3F7" />
                <path d="M 0,3 Q 1.5,2 3,3" stroke="#29B6F6" strokeWidth="0.2" fill="none" opacity="0.5" />
              </pattern>
            </defs>

            {/* Ocean Background */}
            <rect x="0" y="0" width="100" height="70" fill="#0277BD" />
            
            {/* Shallow water areas */}
            <rect x="0" y="0" width="100" height="70" fill="url(#shallowWaterPattern)" opacity="0.3" />

            {/* Grid lines */}
            {showGrid && (
              <g className="pointer-events-none">
                {/* Latitude lines */}
                {[10, 15, 20, 25, 30].map(lat => {
                  const y = latLonToMapCoords(lat, -70).y;
                  return (
                    <g key={`lat-${lat}`}>
                      <line x1="0" y1={y} x2="100" y2={y} stroke="#ffffff" strokeWidth="0.1" opacity="0.3" />
                      <text x="2" y={y - 0.5} fill="#ffffff" fontSize="2" opacity="0.5">{lat}°N</text>
                    </g>
                  );
                })}
                
                {/* Longitude lines */}
                {[-95, -90, -85, -80, -75, -70, -65, -60].map(lon => {
                  const x = latLonToMapCoords(20, lon).x;
                  return (
                    <g key={`lon-${lon}`}>
                      <line x1={x} y1="0" x2={x} y2="70" stroke="#ffffff" strokeWidth="0.1" opacity="0.3" />
                      <text x={x + 0.5} y="68" fill="#ffffff" fontSize="2" opacity="0.5">{Math.abs(lon)}°W</text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Land masses */}
            {showLandMasses && (
              <g>
                {/* Florida */}
                <path d="M 38,5 Q 40,3 42,4 L 42,8 Q 40,10 38,9 Z" 
                      fill="url(#landPattern)" stroke="#654321" strokeWidth="0.2" />
                <text x="40" y="7" fontSize="2.5" fill="#444" textAnchor="middle" className="pointer-events-none">Florida</text>
                
                {/* Cuba */}
                <path d="M 25,18 Q 35,17 40,18 L 39,20 Q 35,21 25,20 Z" 
                      fill="url(#landPattern)" stroke="#654321" strokeWidth="0.2" />
                <text x="32" y="19.5" fontSize="2.5" fill="#444" textAnchor="middle" className="pointer-events-none">Cuba</text>
                
                {/* Jamaica */}
                <path d="M 32,25 L 36,25 L 36,26.5 L 32,26.5 Z" 
                      fill="url(#landPattern)" stroke="#654321" strokeWidth="0.2" />
                <text x="34" y="26" fontSize="2" fill="#444" textAnchor="middle" className="pointer-events-none">Jamaica</text>
                
                {/* Hispaniola */}
                <path d="M 42,24 L 48,24 L 48,26 L 42,26 Z" 
                      fill="url(#landPattern)" stroke="#654321" strokeWidth="0.2" />
                <text x="45" y="25.5" fontSize="2" fill="#444" textAnchor="middle" className="pointer-events-none">Hispaniola</text>
                
                {/* Puerto Rico */}
                <path d="M 52,24.5 L 55,24.5 L 55,25.5 L 52,25.5 Z" 
                      fill="url(#landPattern)" stroke="#654321" strokeWidth="0.2" />
                <text x="53.5" y="25.5" fontSize="1.5" fill="#444" textAnchor="middle" className="pointer-events-none">Puerto Rico</text>
                
                {/* Lesser Antilles chain */}
                <g>
                  {[58, 60, 62, 64, 66, 68].map((x, i) => (
                    <circle key={`antilles-${i}`} cx={x} cy={28 + i * 1.5} r="0.8" 
                            fill="url(#landPattern)" stroke="#654321" strokeWidth="0.1" />
                  ))}
                </g>
                
                {/* Venezuela coastline */}
                <path d="M 45,42 Q 60,41 75,42 L 75,45 Q 60,46 45,45 Z" 
                      fill="url(#landPattern)" stroke="#654321" strokeWidth="0.2" />
                <text x="60" y="44" fontSize="2.5" fill="#444" textAnchor="middle" className="pointer-events-none">Venezuela</text>
                
                {/* Yucatan Peninsula */}
                <path d="M 5,20 Q 10,18 12,22 L 10,25 Q 5,23 5,20 Z" 
                      fill="url(#landPattern)" stroke="#654321" strokeWidth="0.2" />
                <text x="8" y="23" fontSize="2" fill="#444" textAnchor="middle" className="pointer-events-none">Yucatan</text>
                
                {/* Central America */}
                <path d="M 5,30 L 12,28 L 14,35 L 12,40 L 5,42 Z" 
                      fill="url(#landPattern)" stroke="#654321" strokeWidth="0.2" />
                <text x="9" y="36" fontSize="2" fill="#444" textAnchor="middle" className="pointer-events-none" transform="rotate(-10 9 36)">Central America</text>
                
                {/* Trinidad */}
                <circle cx="68" cy="40" r="1.2" fill="url(#landPattern)" stroke="#654321" strokeWidth="0.1" />
                <text x="68" y="41" fontSize="1.5" fill="#444" textAnchor="middle" className="pointer-events-none">Trinidad</text>
                
                {/* Gulf coast of Mexico */}
                <path d="M 2,15 Q 5,10 10,12 L 8,18 Q 3,18 2,15 Z" 
                      fill="url(#landPattern)" stroke="#654321" strokeWidth="0.2" />
                <text x="5" y="15" fontSize="2" fill="#444" textAnchor="middle" className="pointer-events-none">Mexico</text>
              </g>
            )}

            {/* Ports and Locations */}
            {adjustedLocations.map((location) => {
              const coords = latLonToMapCoords(location.lat, location.lon);
              const isPlayerLocation = ports.find(p => 
                p.position[0] === player.ship.position[0] && 
                p.position[2] === player.ship.position[2]
              )?.id === location.id;
              const style = portTypeStyles[location.type as keyof typeof portTypeStyles] || portTypeStyles.island;
              
              return (
                <g key={location.id}>
                  {/* Leader line if needed */}
                  {location.useLeaderLine && (
                    <line
                      x1={coords.x}
                      y1={coords.y}
                      x2={coords.x + location.labelOffsetX}
                      y2={coords.y + location.labelOffsetY}
                      stroke="#333"
                      strokeWidth="0.2"
                      opacity="0.3"
                      className="pointer-events-none"
                    />
                  )}
                  
                  {/* Port circle */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={style.radius / 10}
                    fill={isPlayerLocation ? '#FFD700' : factionColors[location.faction as keyof typeof factionColors] || '#6b7280'}
                    stroke={isPlayerLocation ? '#FFA500' : '#000'}
                    strokeWidth={style.strokeWidth / 10}
                    className="cursor-pointer hover:stroke-white transition-all"
                    onClick={() => handleLocationClick(location)}
                    onMouseEnter={() => setHoveredLocation(location.id)}
                    onMouseLeave={() => setHoveredLocation(null)}
                  />
                  
                  {/* Player indicator */}
                  {isPlayerLocation && (
                    <>
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r="1"
                        fill="none"
                        stroke="#FFD700"
                        strokeWidth="0.2"
                        className="animate-ping"
                      />
                      <text
                        x={coords.x}
                        y={coords.y - 1}
                        fontSize="3"
                        fill="#FFD700"
                        textAnchor="middle"
                        className="pointer-events-none"
                      >
                        ⚓
                      </text>
                    </>
                  )}
                  
                  {/* Faction symbol */}
                  <text
                    x={coords.x}
                    y={coords.y + 0.2}
                    fontSize="1.5"
                    fill={isPlayerLocation ? '#000' : '#fff'}
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {getFactionSymbol(location.faction)}
                  </text>
                  
                  {/* Location name */}
                  <text
                    x={coords.x + location.labelOffsetX}
                    y={coords.y + location.labelOffsetY}
                    fontSize={location.size === 'large' ? '2' : location.size === 'medium' ? '1.8' : '1.5'}
                    fill="#000"
                    stroke="#fff"
                    strokeWidth="0.3"
                    paintOrder="stroke"
                    textAnchor="middle"
                    fontWeight={location.size === 'large' ? 'bold' : 'normal'}
                    className={`pointer-events-none ${hoveredLocation === location.id ? 'opacity-100' : 'opacity-90'}`}
                  >
                    {location.name}
                  </text>
                </g>
              );
            })}

            {/* Player Ship Marker */}
            <g transform={`translate(${playerMapCoords.x}, ${playerMapCoords.y})`}>
              {/* Ship shadow */}
              <ellipse cx="0" cy="0.3" rx="1.2" ry="0.4" fill="#000" opacity="0.3" />
              
              {/* Ship body */}
              <path 
                d="M -1,0 L -0.8,-0.8 L 0.8,-0.8 L 1,0 L 0.5,0.5 L -0.5,0.5 Z" 
                fill="#8B4513" 
                stroke="#654321" 
                strokeWidth="0.1"
              />
              
              {/* Sail */}
              <path 
                d="M 0,-0.8 L 0,-2.5 L 1.5,-1.5 Z" 
                fill="#FFF" 
                stroke="#CCC" 
                strokeWidth="0.1"
                opacity="0.9"
              />
              
              {/* Flag */}
              <rect x="0" y="-2.8" width="0.8" height="0.5" fill="#FF0000" />
              
              {/* Player indicator ring */}
              <circle 
                cx="0" 
                cy="0" 
                r="2" 
                fill="none" 
                stroke="#FFD700" 
                strokeWidth="0.3" 
                strokeDasharray="0.5 0.5"
                className="animate-spin"
                style={{ animationDuration: '3s' }}
              />
              
              {/* "You are here" text */}
              <text 
                x="0" 
                y="3" 
                fontSize="1.2" 
                fill="#FFD700" 
                stroke="#000" 
                strokeWidth="0.2" 
                textAnchor="middle"
                fontWeight="bold"
              >
                YOUR SHIP
              </text>
            </g>

            {/* Wind rose */}
            <g transform="translate(90, 60)">
              <circle cx="0" cy="0" r="5" fill="#fff" opacity="0.8" />
              <line 
                x1="0" 
                y1="0" 
                x2={Math.sin(currentWinds.direction * Math.PI / 180) * 4} 
                y2={-Math.cos(currentWinds.direction * Math.PI / 180) * 4} 
                stroke="#000" 
                strokeWidth="0.3"
                markerEnd="url(#arrowhead)"
              />
              <text x="0" y="-6" fontSize="1.5" textAnchor="middle" fill="#000">N</text>
              <text x="6" y="0.5" fontSize="1.5" textAnchor="middle" fill="#000">E</text>
              <text x="0" y="7" fontSize="1.5" textAnchor="middle" fill="#000">S</text>
              <text x="-6" y="0.5" fontSize="1.5" textAnchor="middle" fill="#000">W</text>
              
              {/* Arrow marker */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#000" />
                </marker>
              </defs>
            </g>
          </svg>

          {/* Map Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button
              onClick={resetView}
              className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-colors"
              title="Reset View (R)"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 ${showGrid ? 'bg-blue-500 text-white' : 'bg-white/90'} hover:bg-blue-600 hover:text-white rounded-lg shadow-lg transition-colors`}
              title="Toggle Grid (G)"
            >
              <Zap className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowLandMasses(!showLandMasses)}
              className={`p-2 ${showLandMasses ? 'bg-green-500 text-white' : 'bg-white/90'} hover:bg-green-600 hover:text-white rounded-lg shadow-lg transition-colors`}
              title="Toggle Land (L)"
            >
              <Map className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowLegend(!showLegend)}
              className={`p-2 ${showLegend ? 'bg-purple-500 text-white' : 'bg-white/90'} hover:bg-purple-600 hover:text-white rounded-lg shadow-lg transition-colors`}
              title="Toggle Legend"
            >
              <Flag className="w-5 h-5" />
            </button>
          </div>

          {/* Legend */}
          {showLegend && (
            <Card className="absolute bottom-4 left-4 p-4 bg-white/95 backdrop-blur-sm max-w-xs">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Compass className="w-5 h-5" />
                Map Legend
              </h3>
              
              <div className="space-y-2 text-sm">
                {/* Port Types */}
                <div>
                  <h4 className="font-semibold mb-1">Port Types:</h4>
                  <div className="space-y-1 ml-2">
                    <div className="flex items-center gap-2">
                      <circle cx="5" cy="5" r="5" fill="#dc2626" className="w-3 h-3" />
                      <span>Major Port</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <circle cx="5" cy="5" r="4" fill="#2563eb" className="w-3 h-3" />
                      <span>Regular Port</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <circle cx="5" cy="5" r="4.5" fill="#000" className="w-3 h-3" />
                      <span>Pirate Haven</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <circle cx="5" cy="5" r="5" fill="#fbbf24" className="w-3 h-3" />
                      <span>Treasure Port</span>
                    </div>
                  </div>
                </div>
                
                {/* Factions */}
                <div>
                  <h4 className="font-semibold mb-1">Factions:</h4>
                  <div className="space-y-1 ml-2">
                    {Object.entries(factionColors).map(([faction, color]) => (
                      <div key={faction} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="capitalize">{faction}</span>
                        <span className="text-xs opacity-70">({getFactionSymbol(faction)})</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Controls */}
                <div className="pt-2 border-t">
                  <h4 className="font-semibold mb-1">Controls:</h4>
                  <div className="space-y-1 ml-2 text-xs">
                    <div>Scroll: Zoom in/out</div>
                    <div>Drag: Pan map</div>
                    <div>G: Toggle grid</div>
                    <div>L: Toggle land</div>
                    <div>R: Reset view</div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Location Details Modal */}
      {selectedLocation && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30 backdrop-blur-sm">
          <Card className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Anchor className="w-6 h-6" />
                  {selectedLocation.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedLocation.lat.toFixed(2)}°N, {Math.abs(selectedLocation.lon).toFixed(2)}°W
                </p>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Type:</span>
                <span className="capitalize">{selectedLocation.type.replace('_', ' ')}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-semibold">Faction:</span>
                <div className="flex items-center gap-1">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: factionColors[selectedLocation.faction as keyof typeof factionColors] || '#6b7280' }}
                  />
                  <span className="capitalize">{selectedLocation.faction}</span>
                  <span>({getFactionSymbol(selectedLocation.faction)})</span>
                </div>
              </div>
              
              {selectedLocation.isPlayerLocation ? (
                <div className="bg-yellow-100 border border-yellow-400 rounded p-3 text-center">
                  <p className="font-semibold text-yellow-800">You are here!</p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800">
                    {selectedLocation.type === 'treasure_port' && "Famous for Spanish treasure fleets!"}
                    {selectedLocation.type === 'pirate_haven' && "A notorious haven for pirates and privateers."}
                    {selectedLocation.type === 'major_port' && "A bustling center of trade and commerce."}
                    {selectedLocation.type === 'port' && "A peaceful trading port."}
                    {selectedLocation.type === 'island' && "A small island settlement."}
                  </p>
                </div>
              )}
              
              {selectedLocation.canSailTo && (
                <button
                  onClick={handleSailToLocation}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation className="w-5 h-5" />
                  Sail to {selectedLocation.name}
                </button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}