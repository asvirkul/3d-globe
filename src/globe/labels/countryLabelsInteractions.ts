import * as THREE from 'three';
import type { LabelEntry } from './types';

type CountryLabelsInteractionOptions = {
  dom: HTMLElement;
  camera: THREE.PerspectiveCamera;
  getFocusedIso: () => string | null;
  getEntryByIso: (iso: string) => LabelEntry | undefined;
  canInteract?: () => boolean;
};

export class CountryLabelInteractions {
  private readonly raycaster = new THREE.Raycaster();
  private readonly mouse = new THREE.Vector2();
  private readonly abort = new AbortController();
  private readonly _hitsBuffer: THREE.Intersection<THREE.Object3D>[] = [];

  constructor(private options: CountryLabelsInteractionOptions) {
    this.options.dom.addEventListener('pointermove', this.onMove, {
      signal: this.abort.signal,
    });

    this.options.dom.addEventListener('pointerleave', this.onLeave, {
      signal: this.abort.signal,
    });
  }

  public dispose(): void {
    this.abort.abort();
    this.options.dom.style.cursor = 'default';
  }

  public pickFocusedIso(clientX: number, clientY: number): string | null {
    if (this.options.canInteract?.() === false) return null;

    const focusedIso = this.options.getFocusedIso?.();
    if (!focusedIso) return null;

    const entry = this.options.getEntryByIso(focusedIso);
    if (!entry || !entry.label.visible || entry.opacity <= 0.05) return null;

    const rect = this.options.dom.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.options.camera);
    this._hitsBuffer.length = 0;
    this.raycaster.intersectObject(entry.label, false, this._hitsBuffer);

    if (this._hitsBuffer.length === 0) return null;
    return focusedIso;
  }

  private onMove = (e: PointerEvent): void => {
    const iso = this.pickFocusedIso(e.clientX, e.clientY);
    this.options.dom.style.cursor = iso ? 'pointer' : 'default';
  };

  private onLeave = (): void => {
    this.options.dom.style.cursor = 'default';
  };
}
