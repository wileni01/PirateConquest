export type LatLon = { lat: number; lon: number };
export type Bounds = { west: number; east: number; south: number; north: number };

// Canonical SVG viewBox used by 2D map rendering
export const VIEWBOX = { w: 1000, h: 700 };

// Covers SE US to Lesser Antilles & Colombian coast, incl. Acapulco if desired.
export const CARIBBEAN_BOUNDS: Bounds = {
  west: -100.0, // includes Acapulco; set to -92 if you want to exclude Pacific
  east: -58.0,  // east of Barbados
  south: 6.0,   // below Trinidad
  north: 33.0,  // above Savannah/Charleston latitude
};

// Margin (in normalized 0..1 units) to keep labels/markers off edges
export const MAP_MARGIN = 0.03; // 3% on each side

export const cosd = (deg: number) => Math.cos((deg * Math.PI) / 180);

// Central latitude for the region (midpoint works well)
export const regionLat0 = (CARIBBEAN_BOUNDS.north + CARIBBEAN_BOUNDS.south) / 2; // ~19.5°N

// Returns normalized u,v in [0,1] with margins applied
export function projectLatLon(
  { lat, lon }: LatLon,
  bounds: Bounds = CARIBBEAN_BOUNDS,
  margin: number = MAP_MARGIN
) {
  const kx = cosd(regionLat0);
  const xSpan = (bounds.east - bounds.west) * kx;
  const ySpan = bounds.north - bounds.south;

  const u = ((lon - bounds.west) * kx) / xSpan;    // 0..1 left→right
  const v = (bounds.north - lat) / ySpan;          // 0..1 top→bottom

  const u2 = margin + (1 - 2 * margin) * Math.min(Math.max(u, 0), 1);
  const v2 = margin + (1 - 2 * margin) * Math.min(Math.max(v, 0), 1);

  return { u: u2, v: v2 };
}

// Helper to convert normalized u,v to MapView viewBox (100 x 70)
export function uvToViewBox(u: number, v: number, viewBoxWidth: number = 100, viewBoxHeight: number = 70) {
  return { x: u * viewBoxWidth, y: v * viewBoxHeight };
}

// New: Direct projection to the canonical VIEWBOX pixel coordinates
export function projectLatLonXY(lat: number, lon: number, bounds: Bounds = CARIBBEAN_BOUNDS, margin: number = MAP_MARGIN) {
  const kx = cosd(regionLat0);
  const xSpan = (bounds.east - bounds.west) * kx;
  const ySpan = bounds.north - bounds.south;

  const u = ((lon - bounds.west) * kx) / xSpan;    // 0..1 left→right
  const v = (bounds.north - lat) / ySpan;          // 0..1 top→bottom

  const um = margin + (1 - 2 * margin) * Math.min(Math.max(u, 0), 1);
  const vm = margin + (1 - 2 * margin) * Math.min(Math.max(v, 0), 1);

  return { x: um * VIEWBOX.w, y: vm * VIEWBOX.h };
}


