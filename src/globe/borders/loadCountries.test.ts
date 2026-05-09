import { computeBB, loadCountries } from './loadCountries';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { MultiPolygonGeometry, PolygonGeometry } from './types';

describe('computeBB', () => {
  it('returns valid bbox for polygon geo', () => {
    const polygon: PolygonGeometry = {
      type: 'Polygon',
      coordinates: [
        [
          [10, 20],
          [10, 40],
          [40, 20],
        ],
      ],
    };

    expect(computeBB(polygon)).toEqual([10, 20, 40, 40]);
  });

  it('returns valid bbox for multipolygon geo', () => {
    const multiPolygon: MultiPolygonGeometry = {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [10, 20],
            [10, 40],
            [40, 20],
          ],
        ],
        [
          [
            [50, 60],
            [50, 80],
            [80, 60],
          ],
        ],
      ],
    };

    expect(computeBB(multiPolygon)).toEqual([10, 20, 80, 80]);
  });
});

describe('loadCountries', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function createFetchMock({
    ok = true,
    contentType = 'application/json',
    json,
    status,
  }: {
    ok?: boolean;
    contentType?: string | null;
    json: unknown;
    status?: number;
  }) {
    return vi.fn(async () => ({
      ok,
      status: status ?? 200,
      headers: {
        get: () => contentType ?? null,
      },
      json: async () => json,
    }));
  }

  const validFeature = {
    properties: {
      ISO_A2: 'IT',
      name: 'Italy',
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ],
    },
  };

  const validGeoJson = {
    type: 'FeatureCollection',
    features: [validFeature],
  };

  it('returns a valid res for valid data', async () => {
    const validResponseFetchMock = createFetchMock({
      ok: true,
      json: validGeoJson,
    });

    vi.stubGlobal('fetch', validResponseFetchMock);
    const result = await loadCountries();

    expect(result.ok).toBe(true);
    if (result.ok === true) {
      expect(result.value.has('IT')).toBe(true);
    }
  });

  it('returns error for invalid GeoJSON structure', async () => {
    vi.stubGlobal('fetch', createFetchMock({ ok: true, json: { type: 'Feature' } }));
    const result = await loadCountries();
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toContain('Invalid GeoJSON');
    } 
  });

  it('returns abort error when aborted', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new DOMException('The operation was aborted.', 'AbortError');
      })
    );
    const result = await loadCountries();
    expect(result.ok).toBe(false);
    if (result.ok === false) {
     expect(result.error).toContain('aborted'); 
    }
  });

  it('fixes iso to uppercase', async () => {
    
    const lowercaseIsoFeature = {
      properties: {
        ISO_A2: 'it',
        name: 'Italy',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
        ],
      },
    };

    const lowercaseIsoGeo = {
      type: 'FeatureCollection',
      features: [lowercaseIsoFeature],
    };

    vi.stubGlobal('fetch', createFetchMock({ json: lowercaseIsoGeo }));

    const result = await loadCountries();

    expect(result.ok).toBe(true);
    if (result.ok === true) {
       expect(result.value.has('IT')).toBe(true);
    }
  });

  it('returns error for non-ok response', async () => {
    vi.stubGlobal('fetch', createFetchMock({ ok: false, status: 404, json: null }));

    const result = await loadCountries();

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toContain('HTTP');
    } 
  });
});
