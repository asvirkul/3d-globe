import * as THREE from 'three';
import type { PinEntry } from './types';

export type CountryPinsInteractionOptions = {
  dom: HTMLElement;
  camera: THREE.PerspectiveCamera;
  canInteract: () => boolean;
  getFocusedIso: () => string | null;
  getPinEntryByIso: (iso: string) => PinEntry | undefined;
};

export class CountryPinInteractions {
  private readonly raycaster = new THREE.Raycaster();
  private readonly mouse = new THREE.Vector2();
  private readonly _hitsBuffer: THREE.Intersection<THREE.Object3D>[] = [];

  constructor(private options: CountryPinsInteractionOptions) {}

  public pickPinIso(clientX: number, clientY: number): string | null {
    if (this.options.canInteract() === false) return null;

    const focusedIso = this.options.getFocusedIso?.();
    if (!focusedIso) return null;

    const entry = this.options.getPinEntryByIso(focusedIso);
    if (!entry || !entry.visible || entry.opacity <= 0.05) return null;

    const rect = this.options.dom.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.options.camera);
    this._hitsBuffer.length = 0;
    this.raycaster.intersectObject(entry.object, false, this._hitsBuffer);

    if (this._hitsBuffer.length === 0) return null;
    return focusedIso;
  }
}
