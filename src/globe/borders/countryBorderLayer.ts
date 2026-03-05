import * as THREE from "three";
import type { CountriesMap } from "./types";
import { buildCountryBorder } from "./buildCountryBorder";

export function createCountryBordersLayer(
  scene: THREE.Object3D,
  countries: CountriesMap,
  radius: number
) {
  let current: THREE.Group | null = null;

    function clear() {
        if (!current) return;

        current.traverse((obj) => {
            if (obj instanceof THREE.Line) {
            obj.geometry.dispose();
            }
        });

        scene.remove(current);
        current = null;
    }

  function highlight(iso: string | null): void {
    clear();
    if (!iso) return;
    const feature = countries.get(iso.toUpperCase());
    if (!feature) {
        console.warn('ISO code on found');
        return;
    }

    current = buildCountryBorder(feature, radius);
    scene.add(current);
  }

  return { highlight, clear };
}