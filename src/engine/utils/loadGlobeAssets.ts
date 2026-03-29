import * as THREE from 'three';
import type { Result } from '../../globe/types';

export type GlobeAssets = {
  earth: THREE.Texture;
  clouds: THREE.Texture;
  lights: THREE.Texture;
};

export async function loadGlobeAssets(): Promise<Result<GlobeAssets>> {
  try {
    const loader = new THREE.TextureLoader();
    const base = import.meta.env.BASE_URL;
    const [earth, clouds, lights] = await Promise.all([
      loader.loadAsync(`${base}assets/textures/earth-low.webp`),
      loader.loadAsync(`${base}assets/textures/clouds.jpg`),
      loader.loadAsync(`${base}assets/textures/lights-low.webp`),
    ]);

    return { ok: true, value: { earth, clouds, lights } };
  } catch {
    return { ok: false, error: 'Texture loading error' };
  }
}
