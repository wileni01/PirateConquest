// Historical Caribbean wind patterns and sailing calculations
export interface WindData {
  direction: number; // 0-360 degrees
  speed: number; // knots
  season: 'dry' | 'wet';
}

export interface GameDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export interface SailingRoute {
  from: string;
  to: string;
  distance: number; // nautical miles
  bearing: number; // compass bearing
  estimatedDays: number;
}

// Caribbean trade wind patterns - historically accurate
export const getHistoricalWinds = (date: GameDate): WindData => {
  const { month } = date;
  
  // Trade winds generally blow from ENE (060°) to ESE (110°)
  // December-May: Dry season, stronger and more consistent trades
  // June-November: Wet season, weaker trades, more variable
  
  if (month >= 12 || month <= 5) {
    // Dry season - stronger, more consistent northeast trades
    return {
      direction: 70 + (Math.random() * 30 - 15), // 55-85° (ENE to E)
      speed: 12 + (Math.random() * 8), // 12-20 knots
      season: 'dry'
    };
  } else {
    // Wet season - weaker, more variable southeast trades
    return {
      direction: 90 + (Math.random() * 40 - 20), // 70-110° (ENE to ESE)
      speed: 8 + (Math.random() * 6), // 8-14 knots
      season: 'wet'
    };
  }
};

// Calculate sailing time based on distance, wind, and ship capabilities
export const calculateSailingTime = (
  distance: number,
  windDirection: number,
  windSpeed: number,
  courseBearing: number,
  shipSpeed: number = 8 // base speed in knots
): number => {
  // Calculate wind angle relative to course
  const windAngle = Math.abs(windDirection - courseBearing);
  const normalizedAngle = windAngle > 180 ? 360 - windAngle : windAngle;
  
  // Wind efficiency based on angle
  let windEfficiency = 1.0;
  if (normalizedAngle < 45) {
    // Running before the wind (best)
    windEfficiency = 1.4;
  } else if (normalizedAngle < 90) {
    // Broad reach (good)
    windEfficiency = 1.2;
  } else if (normalizedAngle < 135) {
    // Beam reach (moderate)
    windEfficiency = 1.0;
  } else if (normalizedAngle < 160) {
    // Close hauled (slow)
    windEfficiency = 0.7;
  } else {
    // Dead into wind (very slow, must tack)
    windEfficiency = 0.4;
  }
  
  // Calculate effective speed
  const windBonus = (windSpeed - 10) * 0.1; // Bonus/penalty for wind strength
  const effectiveSpeed = (shipSpeed + windBonus) * windEfficiency;
  
  // Convert to days (24 hours sailing per day)
  const hours = distance / Math.max(effectiveSpeed, 2); // Minimum 2 knots
  return Math.ceil(hours / 24);
};

// Caribbean island distances (approximate nautical miles)
export const ISLAND_DISTANCES: { [key: string]: { [key: string]: number } } = {
  'jamaica': {
    'cuba': 90,
    'hispaniola': 120,
    'puerto_rico': 200,
    'barbados': 400,
    'trinidad': 450,
    'martinique': 380,
    'antigua': 350,
    'st_lucia': 390,
    'dominica': 370
  },
  'cuba': {
    'jamaica': 90,
    'hispaniola': 50,
    'puerto_rico': 150,
    'barbados': 500,
    'trinidad': 550,
    'martinique': 480,
    'antigua': 450,
    'st_lucia': 490,
    'dominica': 470
  },
  'hispaniola': {
    'jamaica': 120,
    'cuba': 50,
    'puerto_rico': 80,
    'barbados': 450,
    'trinidad': 500,
    'martinique': 430,
    'antigua': 400,
    'st_lucia': 440,
    'dominica': 420
  },
  'puerto_rico': {
    'jamaica': 200,
    'cuba': 150,
    'hispaniola': 80,
    'barbados': 370,
    'trinidad': 420,
    'martinique': 350,
    'antigua': 320,
    'st_lucia': 360,
    'dominica': 340
  },
  'barbados': {
    'jamaica': 400,
    'cuba': 500,
    'hispaniola': 450,
    'puerto_rico': 370,
    'trinidad': 90,
    'martinique': 100,
    'antigua': 130,
    'st_lucia': 80,
    'dominica': 90
  },
  'trinidad': {
    'jamaica': 450,
    'cuba': 550,
    'hispaniola': 500,
    'puerto_rico': 420,
    'barbados': 90,
    'martinique': 150,
    'antigua': 180,
    'st_lucia': 130,
    'dominica': 140
  },
  'martinique': {
    'jamaica': 380,
    'cuba': 480,
    'hispaniola': 430,
    'puerto_rico': 350,
    'barbados': 100,
    'trinidad': 150,
    'antigua': 80,
    'st_lucia': 30,
    'dominica': 40
  },
  'antigua': {
    'jamaica': 350,
    'cuba': 450,
    'hispaniola': 400,
    'puerto_rico': 320,
    'barbados': 130,
    'trinidad': 180,
    'martinique': 80,
    'st_lucia': 60,
    'dominica': 50
  },
  'st_lucia': {
    'jamaica': 390,
    'cuba': 490,
    'hispaniola': 440,
    'puerto_rico': 360,
    'barbados': 80,
    'trinidad': 130,
    'martinique': 30,
    'antigua': 60,
    'dominica': 20
  },
  'dominica': {
    'jamaica': 370,
    'cuba': 470,
    'hispaniola': 420,
    'puerto_rico': 340,
    'barbados': 90,
    'trinidad': 140,
    'martinique': 40,
    'antigua': 50,
    'st_lucia': 20
  }
};

// Calculate bearing between two islands
export const calculateBearing = (from: string, to: string): number => {
  // Simplified bearing calculation based on Caribbean geography
  const bearings: { [key: string]: { [key: string]: number } } = {
    'jamaica': { 'cuba': 45, 'hispaniola': 75, 'puerto_rico': 85, 'barbados': 105, 'trinidad': 115 },
    'cuba': { 'jamaica': 225, 'hispaniola': 90, 'puerto_rico': 110, 'barbados': 135, 'trinidad': 145 },
    'hispaniola': { 'jamaica': 255, 'cuba': 270, 'puerto_rico': 90, 'barbados': 120, 'trinidad': 130 },
    'puerto_rico': { 'jamaica': 265, 'cuba': 290, 'hispaniola': 270, 'barbados': 140, 'trinidad': 150 },
    'barbados': { 'jamaica': 285, 'cuba': 315, 'hispaniola': 300, 'puerto_rico': 320, 'trinidad': 195 },
    'trinidad': { 'jamaica': 295, 'cuba': 325, 'hispaniola': 310, 'puerto_rico': 330, 'barbados': 15 }
  };
  
  return bearings[from]?.[to] || 90;
};

// Format date for display
export const formatDate = (date: GameDate): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return `${months[date.month - 1]} ${date.day}, ${date.year}`;
};

// Advance date by specified days
export const advanceDate = (date: GameDate, days: number): GameDate => {
  let newDate = { ...date };
  newDate.day += days;
  
  // Simple month/year advancement (approximation)
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  while (newDate.day > daysInMonth[newDate.month - 1]) {
    newDate.day -= daysInMonth[newDate.month - 1];
    newDate.month++;
    
    if (newDate.month > 12) {
      newDate.month = 1;
      newDate.year++;
    }
  }
  
  return newDate;
};

// Get wind description for UI
export const getWindDescription = (wind: WindData): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const dirIndex = Math.round(wind.direction / 22.5) % 16;
  
  let strength = '';
  if (wind.speed < 4) strength = 'Light';
  else if (wind.speed < 11) strength = 'Moderate';
  else if (wind.speed < 17) strength = 'Fresh';
  else if (wind.speed < 22) strength = 'Strong';
  else strength = 'Gale';
  
  return `${strength} ${directions[dirIndex]} ${Math.round(wind.speed)}kts`;
};