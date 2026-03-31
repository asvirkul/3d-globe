import * as THREE from 'three';
import type { Result } from '../../globe/types';

export type GlobeAssetProfile = 'compact' | 'default';

export type GlobeAssetUrls = {
  earth: string;
  clouds: string;
  lights: string;
};

export type GlobeAssets = {
  earth: THREE.Texture;
  clouds: THREE.Texture;
  lights: THREE.Texture;
};

export function resolveAssetProfile(): GlobeAssetProfile {
  const pixelWidth = window.innerWidth * (window.devicePixelRatio || 1);

  if (pixelWidth <= 1600) return 'compact';
  return 'default';
}

const ASSET_URLS_PROFILE: Record<GlobeAssetProfile, (baseUrl: string) => GlobeAssetUrls> = {
  default: (baseUrl) => ({
    earth: `${baseUrl}assets/textures/earth-8k.webp`,
    clouds: `${baseUrl}assets/textures/clouds-2k.webp`,
    lights: `${baseUrl}assets/textures/lights-8k.webp`,
  }),
  compact: (baseUrl) => ({
    earth: `${baseUrl}assets/textures/earth-4k.webp`,
    clouds: `${baseUrl}assets/textures/clouds-2k.webp`,
    lights: `${baseUrl}assets/textures/lights-4k.webp`,
  }),
};

export async function loadGlobeAssets(
  profile: GlobeAssetProfile = resolveAssetProfile()
): Promise<Result<GlobeAssets>> {
  try {
    const loader = new THREE.TextureLoader();
    const baseUrl = import.meta.env.BASE_URL;
    const urls = ASSET_URLS_PROFILE[profile](baseUrl);

    const [earth, clouds, lights] = await Promise.all([
      loader.loadAsync(urls.earth),
      loader.loadAsync(urls.clouds),
      loader.loadAsync(urls.lights),
    ]);

    return { ok: true, value: { earth, clouds, lights } };
  } catch {
    return { ok: false, error: 'Texture loading error' };
  }
}
