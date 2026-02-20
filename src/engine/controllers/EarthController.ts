import * as THREE from 'three';

export type EarthControllerOptions = {
  autoRotate?: boolean;
  rotateSpeed?: number;
};

export class EarthController {
  private earth: THREE.Object3D;
  private autoRotate: boolean;
  private rotateSpeed: number;
  private initialAutoRotate: boolean;

  constructor(
    earth: THREE.Object3D,
    options: EarthControllerOptions = {}
  ) {
    this.earth = earth;

    this.initialAutoRotate = options.autoRotate ?? true; 
    this.autoRotate = this.initialAutoRotate;

    this.rotateSpeed = options.rotateSpeed ?? 0.001;
  }

  public pauseAutoRotate() {
    this.autoRotate = false;
  }

  public resumeAutoRotate() {
    if (this.initialAutoRotate) {
      this.autoRotate = true;
    }
  }

  public setRotateSpeed(speed: number) {
    this.rotateSpeed = speed;
  }

  public update(delta: number) {
    if (!this.autoRotate) return;

    this.earth.rotation.y += this.rotateSpeed * delta;
  }
}
