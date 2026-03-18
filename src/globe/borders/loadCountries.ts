import type { Result } from '../types';
import type { CountriesMap, BBox, CountryGeometry, CountryFeature } from './types';

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

  if (geometry.type === 'Polygon') {
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
    const base = import.meta.env.BASE_URL;
    const res = await fetch(`${base}assets/data/border.json`);

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }

    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return { ok: false, error: 'Invalid content type' };
    }

    const geojson = await res.json();
    if (geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
      return { ok: false, error: 'Invalid GeoJSON structure' };
    }

    const countries = new Map<string, CountryFeature>();

    for (const feature of geojson.features) {
      const props = feature?.properties ?? {};
      const nameRaw = props.name ?? props.NAME ?? props.Name;
      const areaRaw = props.area_km2 ?? props.AREA_KM2 ?? props.Area_Km2;
      const labelLonRaw = props.label_lon ?? props.LABEL_LON ?? props.Label_Lon;
      const labelLatRaw = props.label_lat ?? props.LABEL_LAT ?? props.Label_Lat;
      const overrideRaw =
        props.importance_override ?? props.IMPORTANCE_OVERRIDE ?? props.Importance_Override;
      const iso = props.ISO_A2 ?? props.iso_a2 ?? props.Iso_A2;
      const geometry = feature?.geometry;
      const name =
        typeof nameRaw === 'string' && nameRaw.trim().length > 0 ? nameRaw.trim() : undefined;
      const areaNum = typeof areaRaw === 'number' ? areaRaw : Number(areaRaw);
      const overrideNum = typeof overrideRaw === 'number' ? overrideRaw : Number(overrideRaw);
      const area = Number.isFinite(areaNum) && areaNum > 0 ? areaNum : undefined;
      const labelLon =
        typeof labelLonRaw === 'number' &&
        Number.isFinite(labelLonRaw) &&
        labelLonRaw >= -180 &&
        labelLonRaw <= 180
          ? labelLonRaw
          : undefined;
      const labelLat =
        typeof labelLatRaw === 'number' &&
        Number.isFinite(labelLatRaw) &&
        labelLatRaw >= -90 &&
        labelLatRaw <= 90
          ? labelLatRaw
          : undefined;
      const importanceOverride = Number.isFinite(overrideNum)
        ? Math.min(1, Math.max(0, overrideNum))
        : undefined;

      if (
        typeof iso !== 'string' ||
        !geometry ||
        !(geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') ||
        !Array.isArray(geometry.coordinates)
      ) {
        console.warn('[loadCountries] invalid feature', { iso });
        continue;
      }

      const isoNorm = iso.trim().toUpperCase();
      if (!isoNorm) continue;

      countries.set(isoNorm, {
        type: 'Feature',
        properties: {
          iso_a2: isoNorm,
          name: name,
          area_km2: area,
          label_lat: labelLat,
          label_lon: labelLon,
          importance_override: importanceOverride,
        },
        geometry,
        bbox: computeBB(geometry),
      });
    }
    return { ok: true, value: countries };
  } catch {
    return { ok: false, error: 'Failed to load countries data' };
  }
}
