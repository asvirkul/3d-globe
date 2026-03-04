import * as THREE from 'three';
import type { Controller } from '../../engine/GlobeEngine';
import type { CountriesMap } from '../borders/types';
import { xyz2lon } from '../../engine/utils/geo';
import { findCountryByLatLon } from '../borders/countryLookup';

type countryFocusHandlers = {
    onFocus?: (iso: string | null) => void;
    canInteract?: () => boolean;
}

export class CountryFocusController implements Controller {
    
  private raycaster = new THREE.Raycaster();
  private ndcCenter = new THREE.Vector2(0, 0);
  private lastIso: string | null = null;


  
    
  constructor (
    private earthMesh: THREE.Mesh,
    private camera: THREE.PerspectiveCamera,
    private countries: CountriesMap,
    private handlers: countryFocusHandlers = {}
  ) {}

  private clearFocus () {
    if (this.lastIso !== null) {
        this.lastIso = null;
        this.handlers.onFocus?.(null);
    }
  }

  public update(_delta: number): void {
    if (this.handlers.canInteract?.() === false) {
        this.clearFocus();
        return;
    }

    this.raycaster.setFromCamera(this.ndcCenter, this.camera);
        
    const hit = this.raycaster.intersectObject(this.earthMesh, false)[0];
    let iso: string | null = null;

    if (!hit) {
        this.clearFocus();
        return;
    }
    const coords = xyz2lon(hit.point);
    iso = findCountryByLatLon(coords.lat, coords.lon, this.countries);

    if (iso !== this.lastIso) {
        this.lastIso = iso;
        this.handlers.onFocus?.(iso);
    }
  }

}