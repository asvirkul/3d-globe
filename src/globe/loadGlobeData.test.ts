import { loadGlobeData } from './loadGlobeData';
import { loadGlobeAssets } from '../engine/utils/loadGlobeAssets';
import { loadCountries } from './borders/loadCountries';
import { loadPinData } from './pins/loadPinData';
import type { GlobeAssets } from '../engine/utils/loadGlobeAssets';
import type { CountriesMap } from './borders/types';
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../engine/utils/loadGlobeAssets');
vi.mock('./borders/loadCountries');
vi.mock('./pins/loadPinData');

const mockAssets = vi.mocked(loadGlobeAssets);
const mockCountries = vi.mocked(loadCountries);
const mockPins = vi.mocked(loadPinData);

const assets = {} as GlobeAssets;
const countriesRes = new Map() as CountriesMap;
const pinsRes = { UA: { companyCount: 2 } };

describe('loadGlobeData', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns error when assets loading fails', async () => {
    mockAssets.mockResolvedValue({ ok: false, error: 'Texture loading error' });
    mockCountries.mockResolvedValue({ ok: true, value: countriesRes });
    mockPins.mockResolvedValue({ ok: true, value: pinsRes });

    const result = await loadGlobeData();

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toContain('Texture loading error');
    }
  });

  it('returns error when countries fails', async () => {
    mockAssets.mockResolvedValue({ ok: true, value: assets });
    mockCountries.mockResolvedValue({ ok: false, error: 'HTTP 404' });
    mockPins.mockResolvedValue({ ok: true, value: pinsRes });

    const result = await loadGlobeData();

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toContain('HTTP 404');
    }
  });

  it('returns empty obj when pins fail', async () => {
    mockAssets.mockResolvedValue({ ok: true, value: assets });
    mockCountries.mockResolvedValue({ ok: true, value: countriesRes });
    mockPins.mockResolvedValue({ ok: false, error: 'Error loading pin data' });

    const result = await loadGlobeData();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.pins).toEqual({});
    }
  });
});
