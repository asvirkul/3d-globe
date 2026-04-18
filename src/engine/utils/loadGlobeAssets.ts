import * as THREE from 'three';
import type { Result } from '../../globe/types';

export type GlobeAssetProfile = 'compact' | 'default';

export type GlobeAssetUrls = {
  earth: string;
  clouds: string;
  lights: string;
  pinIcon: string;
};

export type GlobeAssets = {
  earth: THREE.Texture;
  clouds: THREE.Texture;
  lights: THREE.Texture;
  pinIcon: THREE.Texture;
};

export type NetworkInfo = {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  saveData?: boolean;
};

export type NavigatorConnection = Navigator & {
  connection?: NetworkInfo;
};

export function resolveAssetProfile(): GlobeAssetProfile {
  const pixelWidth = window.innerWidth * (window.devicePixelRatio || 1);

  const connection = (navigator as NavigatorConnection).connection;
  const slowConnection =
    connection?.effectiveType === '2g' ||
    connection?.effectiveType === '3g' ||
    connection?.saveData === true;

  if (slowConnection) return 'compact';
  if (pixelWidth <= 1800) return 'compact';
  return 'default';
}

const ASSET_URLS_PROFILE: Record<GlobeAssetProfile, (baseUrl: string) => GlobeAssetUrls> = {
  default: (baseUrl) => ({
    earth: `${baseUrl}assets/textures/earth-8k.webp`,
    clouds: `${baseUrl}assets/textures/clouds-2k.webp`,
    lights: `${baseUrl}assets/textures/lights-8k.webp`,
    pinIcon: `${baseUrl}assets/icons/pin.svg`,
  }),
  compact: (baseUrl) => ({
    earth: `${baseUrl}assets/textures/earth-4k.webp`,
    clouds: `${baseUrl}assets/textures/clouds-2k.webp`,
    lights: `${baseUrl}assets/textures/lights-4k.webp`,
    pinIcon: `${baseUrl}assets/icons/pin.svg`,
  }),
};

export async function loadGlobeAssets(
  profile: GlobeAssetProfile = resolveAssetProfile()
): Promise<Result<GlobeAssets>> {
  try {
    const loader = new THREE.TextureLoader();
    const baseUrl = import.meta.env.BASE_URL;
    const urls = ASSET_URLS_PROFILE[profile](baseUrl);

    const [earth, clouds, lights, pinIcon] = await Promise.all([
      loader.loadAsync(urls.earth),
      loader.loadAsync(urls.clouds),
      loader.loadAsync(urls.lights),
      loader.loadAsync(urls.pinIcon),
    ]);

    return { ok: true, value: { earth, clouds, lights, pinIcon } };
  } catch {
    return { ok: false, error: 'Texture loading error' };
  }
}
