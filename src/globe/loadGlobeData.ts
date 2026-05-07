import type { GlobeAssets } from '../engine/utils/loadGlobeAssets';
import type { CountriesMap } from './borders/types';
import type { CountryPinData } from './pins/types';
import type { Result } from './types';
import { loadGlobeAssets } from '../engine/utils/loadGlobeAssets';
import { loadCountries } from './borders/loadCountries';
import { loadPinData } from './pins/loadPinData';

export type GlobeData = {
  assets: GlobeAssets;
  countries: CountriesMap;
  pins: CountryPinData;
};

export async function loadGlobeData(signal?: AbortSignal): Promise<Result<GlobeData>> {
  const [assets, countries, pins] = await Promise.all([
    loadGlobeAssets(),
    loadCountries(signal),
    loadPinData(signal),
  ]);

  if (!assets.ok) {
    return { ok: false, error: assets.error };
  }

  if (!countries.ok) {
    return { ok: false, error: countries.error };
  }

  if (!pins.ok) {
    console.warn(pins.error);
  }

  return {
    ok: true,
    value: {
      assets: assets.value,
      countries: countries.value,
      pins: pins.ok ? pins.value : {},
    },
  };
}
