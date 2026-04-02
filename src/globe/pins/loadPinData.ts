import type { Result } from '../types';
import type { CountryPinData, CountryPinMeta, CountryPinResponse } from './types';

function isCountryPinMetaValid(value: unknown): value is CountryPinMeta {
  if (typeof value !== 'object' || value == null) return false;

  const candidate = value as Record<string, unknown>;
  return isCompanyCountValid(candidate.companyCount);
}

function isCountryPinResValid(value: unknown): value is CountryPinResponse {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.countries !== 'object' || candidate.countries === null) return false;

  return Object.entries(candidate.countries).every(([iso, meta]) => {
    return isIsoA2(iso) && isCountryPinMetaValid(meta);
  });
}

function isIsoA2(value: string): boolean {
  return /^[A-Z]{2}$/.test(value);
}

function isCompanyCountValid(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value > 0
  );
}

export async function loadPinData(signal?: AbortSignal): Promise<Result<CountryPinData>> {
  try {
    const base = import.meta.env.BASE_URL;
    const res = await fetch(`${base}assets/data/company-location.json`, { signal });

    if (!res.ok) {
      return {
        ok: false,
        error: `Error loading pins data: ${res.status}`,
      };
    }

    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return { ok: false, error: 'Invalid content type' };
    }

    const json: unknown = await res.json();

    if (!isCountryPinResValid(json)) {
      return {
        ok: false,
        error: 'Invalid pin data res',
      };
    }

    return {
      ok: true,
      value: json.countries,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { ok: false, error: 'Pin data request was aborted' };
    }

    return { ok: false, error: String(error) };
  }
}
