export interface GlobeAPI {
  start(): void;
  stop(): void;
  destroy(): void;
  setAutoRotate(enabled: boolean): void;
  flyToLatLon(lat: number, lon: number, distance?: number): void;
  highlightCountry(iso: string | null): void;
}

export type CreateGlobeOptions = {
  onCountryPick?: (iso: string | null) => void;
}

export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };
