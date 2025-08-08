const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

export const FLAGS = {
  RENDER_WORKER: params.get('RENDER_WORKER') === '1',
  LOD_ISLANDS: params.get('LOD_ISLANDS') === '1' || params.get('lod') === '1',
  FIXED_STEP_SIM: params.get('FIXED_STEP_SIM') === '1',
  DETERMINISTIC_AI: params.get('DETERMINISTIC_AI') === '1',
};

export type FeatureIndex = {
  name: string;
  offset: number; // float pairs offset
  count: number;  // number of float pairs
  bbox: [number, number, number, number]; // [minLat, minLon, maxLat, maxLon]
};


