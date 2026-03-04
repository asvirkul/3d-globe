import type { CountriesMap } from './types';
import { pointInPolygon, pointInBBox} from './pointInPolygon';


function normalizeLon(lon: number): number {
  return ((lon + 180) % 360 + 360) % 360 - 180;
}

export function findCountryByLatLon(
  lat: number,
  lon: number,
  countries: CountriesMap
): string | null {
  const normalizedLon = normalizeLon(lon);
  for (const [iso, feature] of countries) {
    if (feature.bbox && !pointInBBox(lat, normalizedLon, feature.bbox)) {
      continue;
    }
    const g = feature.geometry;
    if (g.type === "Polygon") {
      if (pointInPolygon(lat, normalizedLon, g.coordinates)) return iso;
    } else {
      for (const polygon of g.coordinates) {
        if (pointInPolygon(lat, normalizedLon, polygon)) return iso;
      }
    }
  }

  return null;
}