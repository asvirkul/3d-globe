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
    const [earth, clouds, lights] = await Promise.all([
      loader.loadAsync('/assets/textures/earth-1.jpg'),
      loader.loadAsync('/assets/textures/clouds.jpg'),
      loader.loadAsync('/assets/textures/earth-2.jpg'),
    ]);

    return { ok: true, value: { earth, clouds, lights } };
  } catch {
    return { ok: false, error: 'Texture loading error' };
  }
}