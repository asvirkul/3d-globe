import * as THREE from 'three';

export type GlobeAssets = {
  earth: THREE.Texture;
  clouds: THREE.Texture;
  lights: THREE.Texture;
};

export async function loadGlobeAssets(): Promise<GlobeAssets> {
  const loader = new THREE.TextureLoader();

  const [earth, clouds, lights] = await Promise.all([
    loader.loadAsync('/assets/textures/earth-1.jpg'),
    loader.loadAsync('/assets/textures/clouds.jpg'),
    loader.loadAsync('/assets/textures/earth-2.jpg'),
  ]);

  return { earth, clouds, lights };
}
