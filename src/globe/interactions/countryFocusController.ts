import * as THREE from 'three';
import type { Controller } from '../../engine/GlobeEngine';
import type { CountriesMap } from '../borders/types';
import { xyz2lon } from '../../engine/utils/geo';
import { findCountryByLatLon } from '../borders/countryLookup';

type CountryFocusHandlers = {
  onFocus?: (iso: string | null) => void;
  canInteract?: () => boolean;
};

export class CountryFocusController implements Controller {
  private raycaster = new THREE.Raycaster();
  private ndcCenter = new THREE.Vector2(0, 0);

  constructor(
    private earthMesh: THREE.Mesh,
    private camera: THREE.PerspectiveCamera,
    private countries: CountriesMap,
    private handlers: CountryFocusHandlers = {}
  ) {}

  public update(_delta: number): void {
    if (this.handlers.canInteract?.() === false) {
      this.handlers.onFocus?.(null);
      return;
    }

    this.raycaster.setFromCamera(this.ndcCenter, this.camera);

    const hit = this.raycaster.intersectObject(this.earthMesh, false)[0];
    if (!hit) {
      this.handlers.onFocus?.(null);
      return;
    }

    const { lat, lon } = xyz2lon(hit.point);
    const iso = findCountryByLatLon(lat, lon, this.countries);
    this.handlers.onFocus?.(iso);
  }
}
