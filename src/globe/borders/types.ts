export type LonLat = readonly [lon: number, lat: number];
export type LinearRing = LonLat[];
export type PolygonCoordinates = LinearRing[];
export type MultiPolygonCoordinates = PolygonCoordinates[];
export type BBox = readonly [minLon: number, minLat: number, maxLon: number, maxLat: number];

export type PolygonGeometry = {
  type: "Polygon";
  coordinates: PolygonCoordinates;
};


export type MultiPolygonGeometry = {
  type: "MultiPolygon";
  coordinates: MultiPolygonCoordinates;
};

export type CountryGeometry = PolygonGeometry | MultiPolygonGeometry;

export type CountryFeature = {
  type: "Feature";
  properties: {
    iso_a2: string;
  };
  geometry: CountryGeometry;
  bbox?: BBox; 
};

export type CountriesMap = Map<string, CountryFeature>;
