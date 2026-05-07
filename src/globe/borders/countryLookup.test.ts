import { findCountryByLatLon, normalizeLon } from './countryLookup';
import type { CountriesMap, PolygonCoordinates } from './types';
import { describe, it, expect } from 'vitest';

function createCountriesMap(
  iso: string,
  bbox: [number, number, number, number] | undefined,
  coordinates: PolygonCoordinates
): CountriesMap {
  return new Map([
    [
      iso,
      {
        type: 'Feature',
        properties: { iso_a2: iso, name: iso, area_km2: 100, label_lat: 0, label_lon: 0 },
        geometry: { type: 'Polygon', coordinates: coordinates },
        bbox,
      },
    ],
  ]);
}

describe('findCountryByLatLon', () => {

  const ring: PolygonCoordinates = [
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ],
  ];

  it('returns iso with bbox', () => {
    const countriesMap = createCountriesMap('UA', [0, 0, 10, 10], ring);
    expect(findCountryByLatLon(5, 5, countriesMap)).toBe('UA');
  });

  it('returns iso without bbox', () => {
    const countriesMap = createCountriesMap('UA', undefined, ring);
    expect(findCountryByLatLon(5, 5, countriesMap)).toBe('UA');
  });

  it('returns null when no intersections were found', () => {
    const countriesMap = createCountriesMap('UA', undefined, ring);
    expect(findCountryByLatLon(15, 15, countriesMap)).toBeNull();
  });
});

describe('normalizeLon', () => {
  it('wraps 181 to -179', () => expect(normalizeLon(181)).toBe(-179));
  it('wraps -181 to 179', () => expect(normalizeLon(-181)).toBe(179));
  it('keeps 0 unchanged', () => expect(normalizeLon(0)).toBe(0));
});
