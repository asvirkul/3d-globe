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

export type CountriesMap = Map<string, CountryFeature>;

export async function loadCountries(): Promise<CountriesMap> {
  const res = await fetch("/assets/data/border.json");

  if (!res.ok) {
    throw new Error(`Failed to load countries.geojson: ${res.status}`);
  }

  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error("Invalid content type");
  }

  const geojson = await res.json();

  if (
    geojson.type !== "FeatureCollection" ||
    !Array.isArray(geojson.features)
  ) {
    throw new Error("Invalid GeoJSON structure");
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

  return countries;
}