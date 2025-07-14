import { useState, useEffect } from "react";
import { usePirateGame } from "../lib/stores/usePirateGame";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { formatDate, getWindDescription } from "../lib/windSystem";

// Caribbean map bounds (longitude/latitude)
const MAP_BOUNDS = {
  north: 32,    // North Carolina
  south: 8,     // Venezuela
  west: -100,   // Gulf of Mexico
  east: -55     // Lesser Antilles
};

// Convert real lat/lon to map coordinates with better scaling
const latLonToMapCoords = (lat: number, lon: number, mapWidth: number = 1200, mapHeight: number = 800) => {
  // Add padding and adjust bounds to better center the Caribbean
  const padding = 60; // pixels of padding
  const effectiveWidth = mapWidth - (2 * padding);
  const effectiveHeight = mapHeight - (2 * padding);
  
  // Adjust bounds for better Caribbean centering with Mexico included
  const adjustedBounds = {
    north: 33,
    south: 7,
    west: -100,
    east: -58
  };
  
  const x = padding + ((lon - adjustedBounds.west) / (adjustedBounds.east - adjustedBounds.west)) * effectiveWidth;
  const y = padding + ((adjustedBounds.north - lat) / (adjustedBounds.north - adjustedBounds.south)) * effectiveHeight;
  
  return { x: Math.max(0, Math.min(mapWidth, x)), y: Math.max(0, Math.min(mapHeight, y)) };
};

// Historical Caribbean and Gulf of Mexico pirate locations with real coordinates
const PIRATE_LOCATIONS = [
  // Major Caribbean Pirate Havens
  { id: 'port_royal', name: 'Port Royal', lat: 17.93, lon: -76.84, size: 'large', type: 'major_port', faction: 'english' },
  { id: 'tortuga', name: 'Tortuga', lat: 20.05, lon: -72.78, size: 'medium', type: 'pirate_haven', faction: 'french' },
  { id: 'nassau', name: 'Nassau', lat: 25.06, lon: -77.35, size: 'medium', type: 'pirate_haven', faction: 'pirate' },
  { id: 'havana', name: 'Havana', lat: 23.13, lon: -82.38, size: 'large', type: 'major_port', faction: 'spanish' },
  { id: 'port_au_prince', name: 'Port-au-Prince', lat: 18.54, lon: -72.34, size: 'medium', type: 'port', faction: 'french' },
  { id: 'santo_domingo', name: 'Santo Domingo', lat: 18.47, lon: -69.90, size: 'medium', type: 'major_port', faction: 'spanish' },
  { id: 'san_juan', name: 'San Juan', lat: 18.47, lon: -66.11, size: 'medium', type: 'major_port', faction: 'spanish' },
  { id: 'ile_a_vache', name: 'Île-à-Vache', lat: 18.08, lon: -73.69, size: 'small', type: 'pirate_haven', faction: 'pirate' },
  
  // Lesser Antilles
  { id: 'martinique', name: 'Martinique', lat: 14.60, lon: -61.08, size: 'small', type: 'port', faction: 'french' },
  { id: 'barbados', name: 'Barbados', lat: 13.10, lon: -59.62, size: 'small', type: 'port', faction: 'english' },
  { id: 'trinidad', name: 'Trinidad', lat: 10.69, lon: -61.22, size: 'medium', type: 'port', faction: 'spanish' },
  { id: 'curacao', name: 'Curaçao', lat: 12.17, lon: -69.00, size: 'small', type: 'port', faction: 'dutch' },
  { id: 'dominica', name: 'Dominica', lat: 15.41, lon: -61.37, size: 'small', type: 'island', faction: 'neutral' },
  { id: 'st_lucia', name: 'St. Lucia', lat: 13.91, lon: -60.98, size: 'small', type: 'island', faction: 'neutral' },
  { id: 'antigua', name: 'Antigua', lat: 17.13, lon: -61.85, size: 'small', type: 'port', faction: 'english' },
  { id: 'guadeloupe', name: 'Guadeloupe', lat: 16.24, lon: -61.58, size: 'small', type: 'port', faction: 'french' },
  { id: 'st_thomas', name: 'St. Thomas', lat: 18.34, lon: -64.93, size: 'small', type: 'port', faction: 'danish' },
  
  // Gulf of Mexico
  { id: 'new_orleans', name: 'New Orleans', lat: 29.95, lon: -90.07, size: 'medium', type: 'major_port', faction: 'french' },
  { id: 'mobile', name: 'Mobile', lat: 30.69, lon: -88.04, size: 'small', type: 'port', faction: 'french' },
  { id: 'pensacola', name: 'Pensacola', lat: 30.42, lon: -87.22, size: 'small', type: 'port', faction: 'spanish' },
  { id: 'veracruz', name: 'Veracruz', lat: 19.20, lon: -96.13, size: 'large', type: 'treasure_port', faction: 'spanish' },
  { id: 'campeche', name: 'Campeche', lat: 19.85, lon: -90.53, size: 'medium', type: 'port', faction: 'spanish' },
  { id: 'tampico', name: 'Tampico', lat: 22.23, lon: -97.86, size: 'small', type: 'port', faction: 'spanish' },
  { id: 'galveston', name: 'Galveston', lat: 29.30, lon: -94.80, size: 'small', type: 'port', faction: 'spanish' },
  { id: 'barataria', name: 'Barataria Bay', lat: 29.67, lon: -90.12, size: 'small', type: 'pirate_haven', faction: 'pirate' },
  
  // North American Coast
  { id: 'charleston', name: 'Charleston', lat: 32.78, lon: -79.93, size: 'medium', type: 'major_port', faction: 'english' },
  { id: 'st_augustine', name: 'St. Augustine', lat: 29.90, lon: -81.31, size: 'small', type: 'port', faction: 'spanish' },
  { id: 'key_west', name: 'Key West', lat: 24.56, lon: -81.78, size: 'small', type: 'island', faction: 'neutral' },
  { id: 'tampa', name: 'Tampa', lat: 27.95, lon: -82.46, size: 'small', type: 'port', faction: 'spanish' },
  { id: 'savannah', name: 'Savannah', lat: 32.08, lon: -81.09, size: 'small', type: 'port', faction: 'english' },
  
  // Central American Coast
  { id: 'cartagena', name: 'Cartagena', lat: 10.39, lon: -75.51, size: 'large', type: 'treasure_port', faction: 'spanish' },
  { id: 'panama_city', name: 'Panama City', lat: 8.98, lon: -79.52, size: 'medium', type: 'treasure_port', faction: 'spanish' },
  { id: 'portobelo', name: 'Portobelo', lat: 9.55, lon: -79.65, size: 'small', type: 'treasure_port', faction: 'spanish' },
  { id: 'santa_marta', name: 'Santa Marta', lat: 11.24, lon: -74.20, size: 'small', type: 'port', faction: 'spanish' },
  { id: 'maracaibo', name: 'Maracaibo', lat: 10.67, lon: -71.64, size: 'medium', type: 'port', faction: 'spanish' },
  { id: 'belize_city', name: 'Belize City', lat: 17.50, lon: -88.20, size: 'small', type: 'port', faction: 'english' },
  
  // Central America Pacific
  { id: 'acapulco', name: 'Acapulco', lat: 16.86, lon: -99.88, size: 'medium', type: 'treasure_port', faction: 'spanish' },
].map(location => ({
  ...location,
  ...latLonToMapCoords(location.lat, location.lon, 1200, 800)
}));

// Land masses for visual representation with accurate geography
const LAND_MASSES = [
  // North America - Florida (more detailed coastline)
  { name: 'Florida', points: [
    { lat: 31.0, lon: -81.5 }, { lat: 30.5, lon: -81.4 }, { lat: 30.0, lon: -81.3 },
    { lat: 29.5, lon: -81.2 }, { lat: 29.0, lon: -81.0 }, { lat: 28.0, lon: -80.5 },
    { lat: 27.0, lon: -80.1 }, { lat: 26.0, lon: -80.1 }, { lat: 25.5, lon: -80.2 },
    { lat: 25.1, lon: -80.4 }, { lat: 24.7, lon: -81.0 }, { lat: 24.5, lon: -81.8 },
    { lat: 24.7, lon: -82.2 }, { lat: 25.0, lon: -82.0 }, { lat: 25.5, lon: -81.8 },
    { lat: 26.0, lon: -81.9 }, { lat: 26.7, lon: -82.1 }, { lat: 27.5, lon: -82.5 },
    { lat: 28.0, lon: -82.6 }, { lat: 28.5, lon: -82.8 }, { lat: 29.0, lon: -83.2 },
    { lat: 29.5, lon: -83.7 }, { lat: 30.0, lon: -84.3 }, { lat: 30.3, lon: -85.0 },
    { lat: 30.3, lon: -86.0 }, { lat: 30.4, lon: -87.0 }, { lat: 30.3, lon: -87.5 },
    { lat: 30.2, lon: -87.3 }, { lat: 30.2, lon: -85.5 }, { lat: 30.5, lon: -84.0 },
    { lat: 30.7, lon: -82.5 }, { lat: 31.0, lon: -81.5 }
  ]},
  
  // Cuba (more accurate elongated shape)
  { name: 'Cuba', points: [
    { lat: 23.2, lon: -82.4 }, { lat: 23.1, lon: -83.0 }, { lat: 22.9, lon: -83.7 },
    { lat: 22.6, lon: -84.0 }, { lat: 22.2, lon: -84.5 }, { lat: 21.8, lon: -84.95 },
    { lat: 21.5, lon: -84.8 }, { lat: 21.0, lon: -84.5 }, { lat: 20.5, lon: -84.0 },
    { lat: 20.2, lon: -82.0 }, { lat: 20.0, lon: -79.0 }, { lat: 19.9, lon: -77.0 },
    { lat: 19.8, lon: -75.5 }, { lat: 19.8, lon: -74.2 }, { lat: 20.2, lon: -74.13 },
    { lat: 20.7, lon: -75.0 }, { lat: 21.2, lon: -76.0 }, { lat: 21.5, lon: -77.0 },
    { lat: 21.8, lon: -77.5 }, { lat: 22.1, lon: -78.3 }, { lat: 22.4, lon: -79.0 },
    { lat: 22.7, lon: -79.8 }, { lat: 23.0, lon: -80.5 }, { lat: 23.2, lon: -81.3 },
    { lat: 23.2, lon: -82.0 }
  ]},
  
  // Jamaica (correct oval shape)
  { name: 'Jamaica', points: [
    { lat: 18.52, lon: -78.4 }, { lat: 18.4, lon: -78.2 }, { lat: 18.2, lon: -77.8 },
    { lat: 18.0, lon: -77.4 }, { lat: 17.8, lon: -77.0 }, { lat: 17.7, lon: -76.5 },
    { lat: 17.7, lon: -76.2 }, { lat: 17.85, lon: -76.2 }, { lat: 18.0, lon: -76.3 },
    { lat: 18.2, lon: -76.5 }, { lat: 18.35, lon: -76.8 }, { lat: 18.45, lon: -77.2 },
    { lat: 18.5, lon: -77.6 }, { lat: 18.52, lon: -78.0 }, { lat: 18.52, lon: -78.4 }
  ]},
  
  // Hispaniola (more detailed shape for Haiti & Dominican Republic)
  { name: 'Hispaniola', points: [
    { lat: 20.0, lon: -72.0 }, { lat: 19.95, lon: -71.7 }, { lat: 19.9, lon: -71.2 },
    { lat: 19.85, lon: -70.7 }, { lat: 19.7, lon: -70.2 }, { lat: 19.5, lon: -69.7 },
    { lat: 19.2, lon: -69.3 }, { lat: 18.9, lon: -69.0 }, { lat: 18.6, lon: -68.7 },
    { lat: 18.3, lon: -68.5 }, { lat: 18.0, lon: -68.4 }, { lat: 17.7, lon: -68.5 },
    { lat: 17.6, lon: -68.8 }, { lat: 17.6, lon: -69.5 }, { lat: 17.7, lon: -70.2 },
    { lat: 17.8, lon: -71.0 }, { lat: 17.9, lon: -71.4 }, { lat: 18.0, lon: -71.7 },
    { lat: 18.2, lon: -72.0 }, { lat: 18.4, lon: -72.4 }, { lat: 18.6, lon: -72.8 },
    { lat: 18.8, lon: -73.2 }, { lat: 19.0, lon: -73.4 }, { lat: 19.3, lon: -73.2 },
    { lat: 19.5, lon: -72.9 }, { lat: 19.7, lon: -72.6 }, { lat: 19.85, lon: -72.3 },
    { lat: 20.0, lon: -72.0 }
  ]},
  
  // Puerto Rico (more accurate rectangular shape)
  { name: 'Puerto Rico', points: [
    { lat: 18.52, lon: -67.3 }, { lat: 18.45, lon: -67.2 }, { lat: 18.3, lon: -67.1 },
    { lat: 18.1, lon: -67.0 }, { lat: 18.0, lon: -66.8 }, { lat: 17.95, lon: -66.5 },
    { lat: 17.93, lon: -66.0 }, { lat: 17.95, lon: -65.6 }, { lat: 18.0, lon: -65.3 },
    { lat: 18.1, lon: -65.3 }, { lat: 18.25, lon: -65.4 }, { lat: 18.4, lon: -65.6 },
    { lat: 18.5, lon: -65.9 }, { lat: 18.52, lon: -66.3 }, { lat: 18.52, lon: -66.8 },
    { lat: 18.52, lon: -67.3 }
  ]},
  
  // Venezuela/Colombia coastline (more detailed)
  { name: 'South America', points: [
    { lat: 12.5, lon: -72.0 }, { lat: 12.2, lon: -71.5 }, { lat: 11.8, lon: -71.0 },
    { lat: 11.5, lon: -70.5 }, { lat: 11.2, lon: -70.0 }, { lat: 10.9, lon: -69.5 },
    { lat: 10.7, lon: -69.0 }, { lat: 10.8, lon: -68.5 }, { lat: 10.8, lon: -68.0 },
    { lat: 10.7, lon: -67.0 }, { lat: 10.6, lon: -66.0 }, { lat: 10.5, lon: -65.0 },
    { lat: 10.4, lon: -64.0 }, { lat: 10.3, lon: -63.0 }, { lat: 10.2, lon: -62.0 },
    { lat: 10.1, lon: -61.5 }, { lat: 10.0, lon: -61.0 }, { lat: 9.8, lon: -60.5 },
    { lat: 9.5, lon: -60.0 }, { lat: 9.0, lon: -59.8 }, { lat: 8.5, lon: -60.0 },
    { lat: 8.0, lon: -61.0 }, { lat: 8.0, lon: -62.0 }, { lat: 8.2, lon: -63.0 },
    { lat: 8.5, lon: -65.0 }, { lat: 8.8, lon: -67.0 }, { lat: 9.0, lon: -69.0 },
    { lat: 9.3, lon: -71.0 }, { lat: 9.7, lon: -72.0 }, { lat: 10.0, lon: -72.5 },
    { lat: 10.5, lon: -73.0 }, { lat: 11.0, lon: -72.8 }, { lat: 11.5, lon: -72.5 },
    { lat: 12.0, lon: -72.2 }, { lat: 12.5, lon: -72.0 }
  ]},
  
  // Mainland Mexico (Gulf Coast)
  { name: 'Mexico', points: [
    { lat: 26.0, lon: -97.2 }, { lat: 25.5, lon: -97.3 }, { lat: 25.0, lon: -97.4 },
    { lat: 24.5, lon: -97.5 }, { lat: 24.0, lon: -97.6 }, { lat: 23.5, lon: -97.7 },
    { lat: 23.0, lon: -97.8 }, { lat: 22.5, lon: -97.85 }, { lat: 22.0, lon: -97.9 },
    { lat: 21.5, lon: -97.5 }, { lat: 21.0, lon: -97.3 }, { lat: 20.5, lon: -97.2 },
    { lat: 20.0, lon: -96.9 }, { lat: 19.5, lon: -96.5 }, { lat: 19.0, lon: -96.1 },
    { lat: 18.7, lon: -95.5 }, { lat: 18.5, lon: -95.0 }, { lat: 18.3, lon: -94.5 },
    { lat: 18.2, lon: -94.0 }, { lat: 18.1, lon: -93.5 }, { lat: 18.0, lon: -93.0 },
    { lat: 18.0, lon: -92.5 }, { lat: 18.2, lon: -92.0 }, { lat: 18.4, lon: -91.5 },
    { lat: 18.6, lon: -91.0 }, { lat: 18.8, lon: -90.5 }, { lat: 19.0, lon: -90.7 },
    { lat: 19.5, lon: -90.8 }, { lat: 20.0, lon: -90.6 }, { lat: 20.5, lon: -90.5 },
    { lat: 21.0, lon: -90.4 }, { lat: 21.6, lon: -90.5 }, { lat: 21.6, lon: -97.0 },
    { lat: 22.0, lon: -97.2 }, { lat: 22.5, lon: -97.4 }, { lat: 23.0, lon: -97.5 },
    { lat: 23.5, lon: -97.4 }, { lat: 24.0, lon: -97.3 }, { lat: 24.5, lon: -97.2 },
    { lat: 25.0, lon: -97.15 }, { lat: 25.5, lon: -97.1 }, { lat: 26.0, lon: -97.2 }
  ]},
  
  // Mexico - Yucatan Peninsula (more accurate shape)
  { name: 'Yucatan', points: [
    { lat: 21.6, lon: -90.5 }, { lat: 21.6, lon: -89.0 }, { lat: 21.5, lon: -88.0 },
    { lat: 21.4, lon: -87.5 }, { lat: 21.2, lon: -87.0 }, { lat: 20.9, lon: -86.8 },
    { lat: 20.5, lon: -86.9 }, { lat: 20.0, lon: -87.0 }, { lat: 19.5, lon: -87.3 },
    { lat: 19.0, lon: -87.6 }, { lat: 18.5, lon: -88.0 }, { lat: 18.2, lon: -88.3 },
    { lat: 18.0, lon: -88.5 }, { lat: 18.0, lon: -89.0 }, { lat: 18.2, lon: -89.5 },
    { lat: 18.5, lon: -90.0 }, { lat: 18.8, lon: -90.4 }, { lat: 19.2, lon: -90.6 },
    { lat: 19.7, lon: -90.7 }, { lat: 20.2, lon: -90.6 }, { lat: 20.7, lon: -90.5 },
    { lat: 21.2, lon: -90.4 }, { lat: 21.6, lon: -90.5 }
  ]},
  
  // Central America (Belize, Guatemala, Honduras, Nicaragua, Costa Rica, Panama)
  { name: 'Central America', points: [
    { lat: 18.0, lon: -88.5 }, { lat: 17.5, lon: -88.2 }, { lat: 16.5, lon: -88.3 },
    { lat: 15.8, lon: -88.0 }, { lat: 15.0, lon: -87.5 }, { lat: 14.5, lon: -87.3 },
    { lat: 14.0, lon: -87.0 }, { lat: 13.5, lon: -87.2 }, { lat: 13.0, lon: -87.5 },
    { lat: 12.5, lon: -87.2 }, { lat: 12.0, lon: -86.8 }, { lat: 11.5, lon: -86.2 },
    { lat: 11.0, lon: -85.7 }, { lat: 10.5, lon: -85.2 }, { lat: 10.0, lon: -84.5 },
    { lat: 9.7, lon: -84.0 }, { lat: 9.5, lon: -83.5 }, { lat: 9.0, lon: -83.0 },
    { lat: 8.5, lon: -82.5 }, { lat: 8.3, lon: -82.0 }, { lat: 8.0, lon: -81.5 },
    { lat: 7.8, lon: -81.0 }, { lat: 7.5, lon: -80.5 }, { lat: 7.3, lon: -80.0 },
    { lat: 7.5, lon: -79.5 }, { lat: 8.0, lon: -79.0 }, { lat: 8.5, lon: -78.5 },
    { lat: 9.0, lon: -78.0 }, { lat: 9.3, lon: -77.5 }, { lat: 9.5, lon: -78.0 },
    { lat: 9.3, lon: -78.5 }, { lat: 9.0, lon: -79.0 }, { lat: 8.7, lon: -79.5 },
    { lat: 8.5, lon: -80.0 }, { lat: 8.7, lon: -80.5 }, { lat: 9.0, lon: -81.0 },
    { lat: 9.5, lon: -82.0 }, { lat: 10.0, lon: -82.8 }, { lat: 10.5, lon: -83.5 },
    { lat: 11.0, lon: -84.0 }, { lat: 11.5, lon: -84.5 }, { lat: 12.0, lon: -85.0 },
    { lat: 12.5, lon: -85.5 }, { lat: 13.0, lon: -86.0 }, { lat: 13.5, lon: -86.5 },
    { lat: 14.0, lon: -87.0 }, { lat: 14.5, lon: -87.5 }, { lat: 15.0, lon: -88.0 },
    { lat: 15.5, lon: -88.2 }, { lat: 16.0, lon: -88.3 }, { lat: 16.5, lon: -88.4 },
    { lat: 17.0, lon: -88.4 }, { lat: 17.5, lon: -88.3 }, { lat: 18.0, lon: -88.5 }
  ]},
  
  // Trinidad
  { name: 'Trinidad', points: [
    { lat: 10.8, lon: -61.9 }, { lat: 10.7, lon: -61.5 }, { lat: 10.5, lon: -61.0 },
    { lat: 10.2, lon: -60.9 }, { lat: 10.1, lon: -61.0 }, { lat: 10.1, lon: -61.4 },
    { lat: 10.2, lon: -61.7 }, { lat: 10.4, lon: -61.9 }, { lat: 10.7, lon: -61.95 },
    { lat: 10.8, lon: -61.9 }
  ]},
];

// Convert land masses to map coordinates
const RENDERED_LAND_MASSES = LAND_MASSES.map(landMass => ({
  ...landMass,
  points: landMass.points.map(point => latLonToMapCoords(point.lat, point.lon, 1200, 800))
}));

function MapView() {
  const { 
    player, 
    ships, 
    ports, 
    gameState, 
    setGameState, 
    weather, 
    timeOfDay,
    currentDate,
    currentWinds,
    isSailing,
    sailingProgress,
    sailingDuration,
    sailingDestination,
    sailToIsland,
    updateSailing,
    updateAI,
    checkCollisions,
    updateCannonballs
  } = usePirateGame();

  const [selectedIsland, setSelectedIsland] = useState<string | null>(null);
  const [playerMapPosition, setPlayerMapPosition] = useState({ x: 250, y: 300 });
  const [encounterShips, setEncounterShips] = useState<typeof ships>([]);
  const [showEncounter, setShowEncounter] = useState(false);
  
  // Update sailing progress
  useEffect(() => {
    if (isSailing) {
      const interval = setInterval(() => {
        updateSailing(0.1); // Update every 100ms
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [isSailing, updateSailing]);

  // Convert 3D world position to map coordinates
  const worldToMap = (worldPos: [number, number, number]) => {
    // Reverse the latLonTo3D conversion
    const lon = (worldPos[0] / 20) - 77.5;
    const lat = 20 - (worldPos[2] / 20);
    return latLonToMapCoords(lat, lon, 1200, 800);
  };

  // Update player position on map based on 3D world position
  useEffect(() => {
    const mapPos = worldToMap(player.ship.position);
    setPlayerMapPosition(mapPos);
  }, [player.ship.position]);

  // Check for random encounters
  useEffect(() => {
    const encounterCheck = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every interval
        const nearbyEnemies = ships.filter(ship => 
          ship.isEnemy && Math.random() < 0.3 // 30% of enemies can encounter
        );
        
        if (nearbyEnemies.length > 0) {
          setEncounterShips(nearbyEnemies.slice(0, 2)); // Max 2 ships per encounter
          setShowEncounter(true);
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(encounterCheck);
  }, [ships]);

  const handleSailTo = (location: typeof PIRATE_LOCATIONS[0]) => {
    if (isSailing) return; // Prevent sailing while already sailing
    
    console.log(`Sailing to ${location.name} (${location.id})`);
    sailToIsland(location.id);
  };

  const handleEngageCombat = () => {
    setShowEncounter(false);
    setGameState('combat');
  };

  const handleEvadeCombat = () => {
    setShowEncounter(false);
    // Small chance of damage when evading
    if (Math.random() < 0.3) {
      console.log("Took damage while evading!");
    }
  };

  const getLocationColor = (location: typeof PIRATE_LOCATIONS[0]) => {
    switch (location.faction) {
      case 'pirate': return '#dc2626';
      case 'spanish': return '#eab308';
      case 'english': return '#2563eb';
      case 'french': return '#7c3aed';
      case 'dutch': return '#ea580c';
      case 'danish': return '#0891b2';
      default: return '#6b7280';
    }
  };

  if (gameState !== 'map') return null;

  return (
    <div className="h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-600 p-4 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <Card className="mb-4 bg-black/80 border-amber-600 text-white flex-shrink-0">
          <CardHeader className="py-3">
            <CardTitle className="text-center text-2xl font-bold text-amber-400">
              Caribbean Sea - Captain's Chart
            </CardTitle>
            <div className="flex justify-center space-x-6 text-sm">
              <div>📅 {formatDate(currentDate)}</div>
              <div>🌤️ {weather.charAt(0).toUpperCase() + weather.slice(1)}</div>
              <div>🕐 {timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}</div>
              <div>💨 {getWindDescription(currentWinds)}</div>
            </div>
            <div className="flex justify-center space-x-8 text-sm mt-2">
              <div>💰 {player.gold} gold</div>
              <div>🏴‍☠️ {player.capturedShips.length} ships</div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
          {/* Map */}
          <Card className="lg:col-span-3 bg-blue-900/90 border-amber-600 text-white flex flex-col">
            <CardContent className="p-4 flex-1">
              <div className="relative w-full h-full bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg overflow-hidden">
                {/* Water texture pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-full bg-repeat" style={{
                    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path d="M20 20c0-11.046-8.954-20-20-20v40c11.046 0 20-8.954 20-20z" fill="#1e40af" opacity="0.3"/></g></svg>')}")`,
                    backgroundSize: '40px 40px'
                  }} />
                </div>

                {/* Land masses */}
                <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                  {RENDERED_LAND_MASSES.map((landMass, index) => (
                    <polygon
                      key={index}
                      points={landMass.points.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="#4a5d23"
                      stroke="#6b7c32"
                      strokeWidth="1"
                      opacity="0.8"
                    />
                  ))}
                </svg>

                {/* Grid lines for navigation */}
                <svg className="absolute inset-0 w-full h-full opacity-20" style={{ pointerEvents: 'none' }}>
                  {/* Vertical lines (longitude) */}
                  {Array.from({ length: 15 }, (_, i) => (
                    <line
                      key={`v-${i}`}
                      x1={i * 80}
                      y1="0"
                      x2={i * 80}
                      y2="800"
                      stroke="#94a3b8"
                      strokeWidth="0.5"
                      strokeDasharray="2,2"
                    />
                  ))}
                  {/* Horizontal lines (latitude) */}
                  {Array.from({ length: 10 }, (_, i) => (
                    <line
                      key={`h-${i}`}
                      x1="0"
                      y1={i * 80}
                      x2="1200"
                      y2={i * 80}
                      stroke="#94a3b8"
                      strokeWidth="0.5"
                      strokeDasharray="2,2"
                    />
                  ))}
                </svg>

                {/* Locations */}
                {PIRATE_LOCATIONS.map(location => (
                  <div
                    key={location.id}
                    className={`absolute cursor-pointer transition-all duration-200 hover:scale-110 ${
                      selectedIsland === location.id ? 'ring-2 ring-amber-400' : ''
                    }`}
                    style={{
                      left: `${location.x}px`,
                      top: `${location.y}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={() => setSelectedIsland(location.id)}
                    onDoubleClick={() => handleSailTo(location)}
                  >
                    <div className={`rounded-full border-2 ${
                      location.faction === 'pirate' ? 'border-red-400 bg-red-600' :
                      location.faction === 'spanish' ? 'border-yellow-400 bg-yellow-600' :
                      location.faction === 'english' ? 'border-blue-400 bg-blue-600' :
                      location.faction === 'french' ? 'border-purple-400 bg-purple-600' :
                      location.faction === 'dutch' ? 'border-orange-400 bg-orange-600' :
                      location.faction === 'danish' ? 'border-cyan-400 bg-cyan-600' :
                      'border-gray-400 bg-gray-600'
                    } ${
                      location.size === 'large' ? 'w-10 h-10' :
                      location.size === 'medium' ? 'w-8 h-8' :
                      'w-6 h-6'
                    } flex items-center justify-center shadow-lg`}>
                      <span className={`text-white ${
                        location.size === 'large' ? 'text-lg' :
                        location.size === 'medium' ? 'text-base' :
                        'text-sm'
                      }`}>
                        {location.type === 'major_port' ? '🏛️' :
                         location.type === 'pirate_haven' ? '🏴‍☠️' :
                         location.type === 'treasure_port' ? '💰' :
                         location.type === 'port' ? '⚓' :
                         location.type === 'island' ? '🏝️' :
                         '🏘️'}
                      </span>
                    </div>
                    <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-sm text-amber-200 whitespace-nowrap bg-black/70 px-2 py-1 rounded font-semibold">
                      {location.name}
                    </div>
                  </div>
                ))}

                {/* Player ship */}
                <div
                  className={`absolute w-8 h-8 bg-red-600 rounded-full border-2 border-amber-400 flex items-center justify-center text-white text-sm font-bold transform -translate-x-1/2 -translate-y-1/2 shadow-lg ${
                    isSailing ? 'animate-bounce' : 'animate-pulse'
                  }`}
                  style={{
                    left: `${playerMapPosition.x}px`,
                    top: `${playerMapPosition.y}px`,
                    zIndex: 10
                  }}
                >
                  {isSailing ? '⛵' : '⚓'}
                </div>
                
                {/* Sailing progress indicator */}
                {isSailing && (
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${playerMapPosition.x}px`,
                      top: `${playerMapPosition.y - 40}px`
                    }}
                  >
                    <div className="bg-black/80 text-white px-2 py-1 rounded text-xs">
                      Sailing to {sailingDestination}
                      <div className="w-20 bg-gray-600 rounded-full h-1 mt-1">
                        <div
                          className="bg-blue-400 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${sailingProgress * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-300 mt-1">
                        Day {Math.floor(sailingProgress * sailingDuration)} of {sailingDuration}
                      </div>
                    </div>
                  </div>
                )}

                {/* Enemy ships */}
                {ships.filter(ship => ship.isEnemy).map(ship => {
                  const mapPos = worldToMap(ship.position);
                  return (
                    <div
                      key={ship.id}
                      className="absolute w-4 h-4 bg-gray-800 rounded-full border border-red-400 flex items-center justify-center text-white text-xs transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${mapPos.x}px`,
                        top: `${mapPos.y}px`
                      }}
                    >
                      ⚔️
                    </div>
                  );
                })}

                {/* Buried treasure */}
                {player.buriedTreasure.map(treasure => {
                  const mapPos = worldToMap(treasure.position);
                  return (
                    <div
                      key={treasure.id}
                      className="absolute w-3 h-3 bg-yellow-500 rounded-full border border-yellow-300 transform -translate-x-1/2 -translate-y-1/2 animate-bounce"
                      style={{
                        left: `${mapPos.x}px`,
                        top: `${mapPos.y}px`
                      }}
                      title={`Buried treasure: ${treasure.gold} gold`}
                    >
                      💰
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Map Legend & Ship Status */}
          <div className="space-y-4 flex flex-col overflow-y-auto">
            <Card className="bg-black/80 border-amber-600 text-white flex-shrink-0">
              <CardHeader className="py-2">
                <CardTitle className="text-amber-400 text-sm">Map Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 py-2">
                <div className="text-xs space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span>Pirate Havens</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                    <span>Spanish Ports</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>English Ports</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span>French Ports</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                    <span>Dutch Ports</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                    <span>Danish Ports</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    <span>Neutral Islands</span>
                  </div>
                </div>
                <div className="text-xs pt-1 border-t border-gray-600">
                  <p>💰 = Treasure Port</p>
                  <p>🏴‍☠️ = Pirate Haven</p>
                  <p>🏛️ = Major Port</p>
                  <p>⚓ = Minor Port</p>
                  <p>🏝️ = Island</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/80 border-amber-600 text-white flex-1 min-h-0">
              <CardHeader className="py-2">
                <CardTitle className="text-amber-400 text-sm">Ship Status</CardTitle>
              </CardHeader>
            <CardContent className="space-y-3 py-2 overflow-y-auto">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Hull:</span>
                  <span>{player.ship.health}/{player.ship.maxHealth}</span>
                </div>
                <Progress value={(player.ship.health / player.ship.maxHealth) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Crew:</span>
                  <span>{player.ship.crew}/{player.ship.maxCrew}</span>
                </div>
                <Progress value={(player.ship.crew / player.ship.maxCrew) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Morale:</span>
                  <span>{player.ship.morale}/{player.ship.maxMorale}</span>
                </div>
                <Progress value={(player.ship.morale / player.ship.maxMorale) * 100} className="h-2" />
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Food:</span>
                  <span>{player.supplies.food}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rum:</span>
                  <span>{player.supplies.rum}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ammunition:</span>
                  <span>{player.supplies.ammunition}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-600">
                <div className="flex justify-between text-sm">
                  <span>Reputation:</span>
                  <span className="text-green-400">{player.reputation}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Infamy:</span>
                  <span className="text-red-400">{player.infamy}</span>
                </div>
              </div>

              <div className="space-y-2 mt-auto">
                <Button 
                  onClick={() => setGameState('sailing')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-sm py-1"
                >
                  Set Sail
                </Button>
                <Button 
                  onClick={() => setGameState('menu')}
                  className="w-full bg-gray-600 hover:bg-gray-500 text-sm py-1"
                >
                  Back to Menu
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Location Details */}
        {selectedIsland && (
          <Card className="mt-4 bg-black/80 border-amber-600 text-white flex-shrink-0">
            <CardContent className="p-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <h3 className="text-lg font-bold text-amber-400">
                    {PIRATE_LOCATIONS.find(l => l.id === selectedIsland)?.name}
                  </h3>
                  {(() => {
                    const location = PIRATE_LOCATIONS.find(l => l.id === selectedIsland);
                    if (!location) return null;
                    
                    const port = ports.find(p => 
                      p.name.toLowerCase().includes(location.name.toLowerCase()) ||
                      location.name.toLowerCase().includes(p.name.toLowerCase())
                    );
                    
                    return (
                      <div className="space-y-1">
                        <p className="text-xs"><strong>Type:</strong> {location.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs"><strong>Faction:</strong> <Badge className={`text-xs ${
                          location.faction === 'spanish' ? 'bg-yellow-600' :
                          location.faction === 'english' ? 'bg-blue-600' :
                          location.faction === 'french' ? 'bg-purple-600' :
                          location.faction === 'dutch' ? 'bg-orange-600' :
                          location.faction === 'danish' ? 'bg-cyan-600' :
                          location.faction === 'pirate' ? 'bg-red-600' : 'bg-gray-600'
                        }`}>{location.faction}</Badge></p>
                        <p className="text-xs"><strong>Size:</strong> {location.size}</p>
                        <p className="text-xs"><strong>Coordinates:</strong> {location.lat?.toFixed(1)}°N, {Math.abs(location.lon || 0).toFixed(1)}°W</p>
                        
                        {port && (
                          <div className="pt-1 border-t border-gray-600">
                            <p className="text-xs"><strong>Governor:</strong> {port.governor.name}</p>
                            <p className="text-xs"><strong>Attitude:</strong> {port.governor.attitude}</p>
                            <p className="text-xs"><strong>Fortification:</strong> {port.fortification}/10</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <Button 
                  onClick={() => {
                    const location = PIRATE_LOCATIONS.find(l => l.id === selectedIsland);
                    if (location) handleSailTo(location);
                  }}
                  className="bg-green-600 hover:bg-green-500 text-sm py-1 px-2 ml-2"
                  disabled={isSailing}
                >
                  {isSailing ? 'Sailing...' : 'Sail To'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ship Encounter Modal */}
        {showEncounter && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-black/90 border-red-600 text-white max-w-md">
              <CardHeader>
                <CardTitle className="text-red-400 text-center">Ship Encounter!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center">
                  Enemy ships spotted on the horizon! {encounterShips.length} hostile vessel{encounterShips.length > 1 ? 's' : ''} approaching.
                </p>
                
                <div className="space-y-2">
                  {encounterShips.map(ship => (
                    <div key={ship.id} className="flex justify-between text-sm">
                      <span>{ship.type} (Crew: {ship.crew})</span>
                      <span className="text-red-400">Health: {ship.health}/{ship.maxHealth}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleEngageCombat}
                    className="flex-1 bg-red-600 hover:bg-red-500"
                  >
                    Engage in Combat
                  </Button>
                  <Button 
                    onClick={handleEvadeCombat}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-500"
                  >
                    Attempt to Evade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapView;