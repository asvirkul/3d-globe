import type { BBox, LinearRing, PolygonCoordinates } from './types';

export function pointInBBox(
  lat: number,
  lon: number,
  [minLon, minLat, maxLon, maxLat]: BBox
): boolean {
  const withinLat = lat >= minLat && lat <= maxLat;

  const withinLon =
    minLon <= maxLon ? lon >= minLon && lon <= maxLon : lon >= minLon || lon <= maxLon;

  return withinLat && withinLon;
}

export function pointInPolygon(lat: number, lon: number, rings: PolygonCoordinates): boolean {
  if (!rings || rings.length === 0) return false;
  const [outerRing, ...holes] = rings;
  if (!pointInRing(lat, lon, outerRing)) {
    return false;
  }

  for (const hole of holes) {
    if (pointInRing(lat, lon, hole)) {
      return false;
    }
  }

  return true;
}

function pointInRing(lat: number, lon: number, ring: LinearRing): boolean {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const dy = yj - yi;
    if (dy === 0) continue;
    const intersects = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / dy + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}
