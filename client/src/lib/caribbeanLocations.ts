// Historical Caribbean and Gulf of Mexico pirate locations with real coordinates
export const CARIBBEAN_LOCATIONS = [
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
  
  // US East Coast
  { id: 'charleston', name: 'Charleston', lat: 32.78, lon: -79.93, size: 'medium', type: 'major_port', faction: 'english' },
  { id: 'savannah', name: 'Savannah', lat: 32.08, lon: -81.09, size: 'small', type: 'port', faction: 'english' },
  { id: 'st_augustine', name: 'St. Augustine', lat: 29.89, lon: -81.31, size: 'small', type: 'port', faction: 'spanish' },
  { id: 'key_west', name: 'Key West', lat: 24.56, lon: -81.78, size: 'small', type: 'island', faction: 'neutral' },
  
  // South America
  { id: 'cartagena', name: 'Cartagena', lat: 10.39, lon: -75.51, size: 'large', type: 'treasure_port', faction: 'spanish' },
  { id: 'maracaibo', name: 'Maracaibo', lat: 10.64, lon: -71.64, size: 'medium', type: 'port', faction: 'spanish' },
  { id: 'caracas', name: 'Caracas', lat: 10.48, lon: -66.90, size: 'medium', type: 'port', faction: 'spanish' },
  { id: 'cumana', name: 'Cumaná', lat: 10.46, lon: -64.17, size: 'small', type: 'port', faction: 'spanish' },
  { id: 'georgetown', name: 'Georgetown', lat: 6.80, lon: -58.16, size: 'small', type: 'port', faction: 'dutch' },
  
  // Additional Caribbean Islands
  { id: 'aruba', name: 'Aruba', lat: 12.52, lon: -69.97, size: 'small', type: 'island', faction: 'dutch' },
  { id: 'bonaire', name: 'Bonaire', lat: 12.20, lon: -68.26, size: 'small', type: 'island', faction: 'dutch' },
  { id: 'grenada', name: 'Grenada', lat: 12.12, lon: -61.69, size: 'small', type: 'island', faction: 'neutral' },
  { id: 'tobago', name: 'Tobago', lat: 11.25, lon: -60.67, size: 'small', type: 'island', faction: 'neutral' },
  { id: 'st_vincent', name: 'St. Vincent', lat: 13.25, lon: -61.20, size: 'small', type: 'island', faction: 'neutral' },
  
  // Central America
  { id: 'belize', name: 'Belize', lat: 17.50, lon: -88.20, size: 'small', type: 'port', faction: 'spanish' },
  { id: 'roatan', name: 'Roatan', lat: 16.34, lon: -86.53, size: 'small', type: 'pirate_haven', faction: 'pirate' },
  { id: 'panama', name: 'Panama', lat: 8.98, lon: -79.52, size: 'medium', type: 'treasure_port', faction: 'spanish' },
  { id: 'portobelo', name: 'Portobelo', lat: 9.55, lon: -79.65, size: 'medium', type: 'treasure_port', faction: 'spanish' },
  
  // Central America Pacific
  { id: 'acapulco', name: 'Acapulco', lat: 16.86, lon: -99.88, size: 'medium', type: 'treasure_port', faction: 'spanish' },
] as const;

export type CaribbeanLocation = typeof CARIBBEAN_LOCATIONS[number];