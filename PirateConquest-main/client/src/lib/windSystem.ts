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

// Historical Caribbean and Gulf of Mexico locations with accurate nautical mile distances
export const PIRATE_LOCATIONS: { [key: string]: { [key: string]: number } } = {
  // Major Caribbean Islands
  'port_royal': {
    'havana': 150, 'tortuga': 120, 'nassau': 300, 'port_au_prince': 100,
    'santo_domingo': 180, 'san_juan': 280, 'martinique': 500, 'barbados': 600,
    'trinidad': 650, 'curacao': 400, 'cartagena': 220, 'veracruz': 800
  },
  'tortuga': {
    'port_royal': 120, 'havana': 180, 'port_au_prince': 40, 'nassau': 350,
    'santo_domingo': 80, 'san_juan': 200, 'martinique': 420, 'barbados': 520,
    'trinidad': 570, 'curacao': 320, 'cartagena': 280, 'veracruz': 950
  },
  'nassau': {
    'port_royal': 300, 'tortuga': 350, 'havana': 200, 'charleston': 280,
    'st_augustine': 220, 'key_west': 150, 'santo_domingo': 400, 'san_juan': 500,
    'martinique': 700, 'barbados': 800, 'new_orleans': 600, 'mobile': 450
  },
  'havana': {
    'port_royal': 150, 'tortuga': 180, 'nassau': 200, 'key_west': 90,
    'veracruz': 500, 'campeche': 350, 'new_orleans': 450, 'mobile': 400,
    'santo_domingo': 250, 'san_juan': 350, 'cartagena': 320, 'port_au_prince': 200
  },
  'port_au_prince': {
    'tortuga': 40, 'port_royal': 100, 'havana': 200, 'santo_domingo': 120,
    'san_juan': 160, 'martinique': 380, 'barbados': 480, 'trinidad': 530,
    'curacao': 280, 'cartagena': 240, 'nassau': 400, 'ile_a_vache': 30
  },
  'santo_domingo': {
    'port_au_prince': 120, 'tortuga': 80, 'port_royal': 180, 'havana': 250,
    'san_juan': 180, 'martinique': 320, 'barbados': 420, 'trinidad': 470,
    'curacao': 220, 'cartagena': 180, 'nassau': 400, 'ile_a_vache': 100
  },
  'san_juan': {
    'santo_domingo': 180, 'port_au_prince': 160, 'tortuga': 200, 'port_royal': 280,
    'havana': 350, 'martinique': 200, 'barbados': 300, 'trinidad': 350,
    'curacao': 180, 'cartagena': 120, 'nassau': 500, 'st_thomas': 40
  },
  
  // Lesser Antilles
  'martinique': {
    'san_juan': 200, 'barbados': 120, 'trinidad': 200, 'curacao': 200,
    'cartagena': 280, 'port_royal': 500, 'tortuga': 420, 'dominica': 30,
    'st_lucia': 25, 'antigua': 90, 'guadeloupe': 80, 'st_vincent': 60
  },
  'barbados': {
    'martinique': 120, 'trinidad': 120, 'curacao': 280, 'cartagena': 360,
    'port_royal': 600, 'tortuga': 520, 'san_juan': 300, 'dominica': 90,
    'st_lucia': 80, 'antigua': 200, 'guadeloupe': 180, 'st_vincent': 80
  },
  'trinidad': {
    'barbados': 120, 'martinique': 200, 'curacao': 160, 'cartagena': 240,
    'port_royal': 650, 'tortuga': 570, 'san_juan': 350, 'dominica': 180,
    'st_lucia': 160, 'antigua': 280, 'guadeloupe': 260, 'st_vincent': 140
  },
  'curacao': {
    'trinidad': 160, 'barbados': 280, 'martinique': 200, 'cartagena': 80,
    'port_royal': 400, 'tortuga': 320, 'san_juan': 180, 'santo_domingo': 220,
    'port_au_prince': 280, 'ile_a_vache': 250, 'maracaibo': 50, 'caracas': 120
  },
  
  // Gulf of Mexico
  'new_orleans': {
    'mobile': 120, 'pensacola': 150, 'havana': 450, 'key_west': 400,
    'veracruz': 650, 'campeche': 500, 'nassau': 600, 'charleston': 550,
    'galveston': 350, 'tampico': 600, 'barataria': 60, 'biloxi': 80
  },
  'mobile': {
    'new_orleans': 120, 'pensacola': 60, 'havana': 400, 'key_west': 350,
    'veracruz': 700, 'campeche': 550, 'nassau': 450, 'charleston': 450,
    'galveston': 400, 'tampico': 650, 'st_augustine': 300, 'biloxi': 50
  },
  'veracruz': {
    'havana': 500, 'campeche': 200, 'new_orleans': 650, 'mobile': 700,
    'tampico': 250, 'port_royal': 800, 'tortuga': 950, 'cartagena': 600,
    'galveston': 500, 'acapulco': 400, 'panama_city': 650, 'merida': 150
  },
  'campeche': {
    'veracruz': 200, 'havana': 350, 'new_orleans': 500, 'mobile': 550,
    'tampico': 300, 'port_royal': 700, 'tortuga': 850, 'cartagena': 500,
    'galveston': 400, 'merida': 100, 'cozumel': 150, 'belize_city': 200
  },
  
  // North American Coast
  'charleston': {
    'nassau': 280, 'mobile': 450, 'new_orleans': 550, 'st_augustine': 200,
    'key_west': 400, 'havana': 450, 'port_royal': 600, 'tortuga': 700,
    'cape_hatteras': 250, 'savannah': 120, 'wilmington': 180, 'norfolk': 350
  },
  'st_augustine': {
    'charleston': 200, 'nassau': 220, 'mobile': 300, 'new_orleans': 400,
    'key_west': 250, 'havana': 300, 'port_royal': 500, 'tortuga': 600,
    'cape_canaveral': 80, 'savannah': 150, 'miami': 200, 'tampa': 150
  },
  'key_west': {
    'havana': 90, 'nassau': 150, 'st_augustine': 250, 'mobile': 350,
    'new_orleans': 400, 'port_royal': 200, 'tortuga': 250, 'miami': 150,
    'tampa': 200, 'dry_tortugas': 70, 'cape_sable': 100, 'marathon': 50
  },
  
  // Central American Coast
  'cartagena': {
    'curacao': 80, 'trinidad': 240, 'barbados': 360, 'martinique': 280,
    'san_juan': 120, 'santo_domingo': 180, 'port_au_prince': 240, 'port_royal': 220,
    'tortuga': 280, 'havana': 320, 'panama_city': 200, 'santa_marta': 60,
    'maracaibo': 130, 'caracas': 200, 'la_guaira': 180, 'puerto_cabello': 150
  },
  'panama_city': {
    'cartagena': 200, 'curacao': 280, 'trinidad': 440, 'barbados': 560,
    'martinique': 480, 'san_juan': 320, 'santo_domingo': 380, 'port_royal': 420,
    'tortuga': 480, 'havana': 520, 'veracruz': 650, 'acapulco': 500,
    'portobelo': 40, 'nombre_de_dios': 50, 'chagres': 30, 'colon': 45
  }
};

// Calculate bearing between two locations based on historical Caribbean geography
export const calculateBearing = (from: string, to: string): number => {
  // Comprehensive bearing calculations for Caribbean and Gulf of Mexico
  const bearings: { [key: string]: { [key: string]: number } } = {
    'port_royal': { 
      'havana': 315, 'tortuga': 45, 'nassau': 15, 'port_au_prince': 60,
      'santo_domingo': 75, 'san_juan': 90, 'martinique': 105, 'barbados': 120,
      'trinidad': 135, 'curacao': 150, 'cartagena': 180, 'veracruz': 270
    },
    'tortuga': {
      'port_royal': 225, 'havana': 270, 'port_au_prince': 180, 'nassau': 45,
      'santo_domingo': 135, 'san_juan': 105, 'martinique': 120, 'barbados': 135,
      'trinidad': 150, 'curacao': 165, 'cartagena': 195, 'veracruz': 285
    },
    'nassau': {
      'port_royal': 195, 'tortuga': 225, 'havana': 240, 'charleston': 315,
      'st_augustine': 270, 'key_west': 225, 'santo_domingo': 165, 'san_juan': 135,
      'martinique': 120, 'barbados': 135, 'new_orleans': 255, 'mobile': 270
    },
    'havana': {
      'port_royal': 135, 'tortuga': 90, 'nassau': 60, 'key_west': 180,
      'veracruz': 255, 'campeche': 240, 'new_orleans': 315, 'mobile': 330,
      'santo_domingo': 105, 'san_juan': 90, 'cartagena': 150, 'port_au_prince': 105
    },
    'new_orleans': {
      'mobile': 90, 'pensacola': 75, 'havana': 135, 'key_west': 135,
      'veracruz': 225, 'campeche': 195, 'nassau': 75, 'charleston': 60,
      'galveston': 270, 'tampico': 210, 'barataria': 180, 'biloxi': 105
    },
    'veracruz': {
      'havana': 75, 'campeche': 30, 'new_orleans': 45, 'mobile': 60,
      'tampico': 315, 'port_royal': 90, 'tortuga': 105, 'cartagena': 120,
      'galveston': 345, 'acapulco': 285, 'panama_city': 135, 'merida': 15
    },
    'cartagena': {
      'curacao': 60, 'trinidad': 90, 'barbados': 75, 'martinique': 60,
      'san_juan': 15, 'santo_domingo': 345, 'port_au_prince': 330, 'port_royal': 360,
      'tortuga': 345, 'havana': 330, 'panama_city': 225, 'santa_marta': 75,
      'maracaibo': 105, 'caracas': 120, 'la_guaira': 90, 'puerto_cabello': 75
    },
    'charleston': {
      'nassau': 135, 'mobile': 225, 'new_orleans': 240, 'st_augustine': 180,
      'key_west': 210, 'havana': 195, 'port_royal': 165, 'tortuga': 150,
      'cape_hatteras': 30, 'savannah': 195, 'wilmington': 45, 'norfolk': 15
    }
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