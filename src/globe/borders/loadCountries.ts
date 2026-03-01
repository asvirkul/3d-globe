export type CountryFeature = {
  type: "Feature";
  properties: {
    iso_a2: string;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
};

type Result<T> = 
  | { ok: true, value: T }
  | { ok: false, error: string };

export type CountriesMap = Map<string, CountryFeature>;

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
          geometry
        });
    }
    return { ok: true, value: countries };
  } catch (e) {
    return { ok: false, error: 'Failed to load countries data' }
  }
}
