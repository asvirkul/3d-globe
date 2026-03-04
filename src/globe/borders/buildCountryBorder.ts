import * as THREE from "three";
import { lon2xyz } from "../../engine/utils/geo";
import type { CountryFeature } from "./types";

const BORDER_MATERIAL = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.5,
});

export function buildCountryBorder(
  feature: CountryFeature,
  radius: number,
  altitude = 0.6
): THREE.Group {

  const group = new THREE.Group();
  const g = feature.geometry;

  const polygons =
    g.type === "Polygon"
      ? [g.coordinates]
      : g.coordinates;

  for (const polygon of polygons) {
    if (!polygon.length) continue;

    const outerRing = polygon[0];
    if (!outerRing || outerRing.length < 3) continue;

    const points: THREE.Vector3[] = [];

    for (const [lon, lat] of outerRing) {
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
      points.push(lon2xyz(lat, lon, radius + altitude));
    }

    if (points.length < 3) continue;

    if (!points[0].equals(points[points.length - 1])) {
      points.push(points[0].clone());
    }

    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeo, BORDER_MATERIAL);
    group.add(line);
  }

  return group;
}