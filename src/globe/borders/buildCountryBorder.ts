import * as THREE from "three";
import { lon2xyz } from "../../engine/utils/geo";
import type { CountryFeature } from "./loadCountries";

type LonLat = [number, number];

const BORDER_MATERIAL = new THREE.LineBasicMaterial({
  color: 0xfffff,
  transparent: true,
  opacity: 0.5,
});

export function buildCountryBorder(
  feature: CountryFeature,
  radius: number,
  altitude = 0.6
): THREE.Group {

  const group = new THREE.Group();
  const geometry = feature.geometry;

  if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") {
    console.warn("Unsupported geometry type:", geometry.type);
    return group;
  }
  
  const polygons =
  geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.coordinates;

  for (const polygon of polygons) {
    if (!polygon || !polygon.length) continue;

    const outerRing = polygon[0] as LonLat[] | undefined;
    if (!outerRing || outerRing.length < 3) continue;

    const points: THREE.Vector3[] = [];

    for (const coord of outerRing) {
        if (!coord || coord.length < 2) continue;

        const [lon, lat] = coord;
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;

        points.push(lon2xyz(lat, lon, radius + altitude));
    }

    if (points.length < 3) continue;

    const first = points[0];
    const last = points[points.length - 1];
    if (!first.equals(last)) points.push(first.clone());

    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeo, BORDER_MATERIAL);
    group.add(line);
  }

  return group;
}