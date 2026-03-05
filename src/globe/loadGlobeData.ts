import type { GlobeAssets } from '../engine/utils/loadGlobeAssets';
import type { CountriesMap } from './borders/types';
import type { Result } from './types';
import { loadGlobeAssets } from '../engine/utils/loadGlobeAssets';
import { loadCountries } from './borders/loadCountries';

export type GlobeData = {
  assets: GlobeAssets;
  countries: CountriesMap;
};

export async function loadGlobeData(): Promise<Result<GlobeData>> {
  const [assets, countries] = await Promise.all([loadGlobeAssets(), loadCountries()]);

  if (!assets.ok) {
    return { ok: false, error: assets.error };
  }

  if (!countries.ok) {
    return { ok: false, error: countries.error };
  }

  return {
    ok: true,
    value: {
      assets: assets.value,
      countries: countries.value,
    },
  };
}
