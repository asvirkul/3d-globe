import type { Result } from '../types';
import type { CountriesMap,  BBox, CountryGeometry, CountryFeature } from './types';

export function computeBB(geometry: CountryGeometry): BBox {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  function expand(lon: number, lat: number) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates) {
      for (const [lon, lat] of ring) {
        expand(lon, lat);
      }
    }
  } else {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        for (const [lon, lat] of ring) {
          expand(lon, lat);
        }
      }
    }
  }

  return [minLon, minLat, maxLon, maxLat];
}

export async function loadCountries(): Promise<Result<CountriesMap>> {
  try {
      const res = await fetch("/assets/data/border.json");
    
      if (!res.ok) {
        return { ok: false, error: `HTTP ${res.status}` };
      }
    
      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        return { ok: false, error: "Invalid content type" };
      }
    
      const geojson = await res.json();
      if (
        geojson.type !== "FeatureCollection" ||
        !Array.isArray(geojson.features)
      ) {
        return { ok: false, error: "Invalid GeoJSON structure" };
      }
    
      const countries = new Map<string, CountryFeature>();
    
      for (const feature of geojson.features) {
        const props = feature?.properties ?? {};
        const iso = props.ISO_A2 ?? props.iso_a2 ?? props.Iso_A2;
        const geometry = feature?.geometry;
    
        if (
          typeof iso !== "string" ||
          !geometry ||
          !(
            geometry.type === "Polygon" ||
            geometry.type === "MultiPolygon"
          ) ||
          !Array.isArray(geometry.coordinates)
        ) {
          continue;
        }
    
        countries.set(iso.toUpperCase(), {
          type: "Feature",
          properties: { iso_a2: iso },
          geometry,
          bbox: computeBB(geometry),
        });
    }    
    return { ok: true, value: countries };
  } catch (e) {
    return { ok: false, error: 'Failed to load countries data' }
  }
}
