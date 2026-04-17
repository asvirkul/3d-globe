import { CameraController } from './CameraController';
import type { Controller } from '../GlobeEngine';

export type EarthControllerOptions = {
  autoRotate?: boolean;
  rotateSpeed?: number;
};

export class EarthController implements Controller {
  private cameraController: CameraController;
  private autoRotate: boolean;
  private rotateSpeed: number;
  private initialAutoRotate: boolean;
  private autoRotateBlocker: (() => boolean) | null = null;

  constructor(cameraController: CameraController, options: EarthControllerOptions = {}) {
    this.cameraController = cameraController;

    this.initialAutoRotate = options.autoRotate ?? true;
    this.autoRotate = this.initialAutoRotate;

    this.rotateSpeed = options.rotateSpeed ?? 0.001;
  }

  public setAutoRotateBlocker(blocker: (() => boolean) | null): void {
    this.autoRotateBlocker = blocker;
  }

  private get shouldAutoRotate(): boolean {
    const isBlocked = this.autoRotateBlocker?.() ?? false;
    if (!this.autoRotate) return false;

    return this.autoRotate && !isBlocked;
  }

  public pauseAutoRotate(): void {
    this.autoRotate = false;
  }

  public resumeAutoRotate(): void {
    if (this.initialAutoRotate) {
      this.autoRotate = true;
    }
  }

  public setRotateSpeed(speed: number): void {
    this.rotateSpeed = speed;
  }

  public update(delta: number): void {
    if (!this.autoRotate) return;
    if (!this.shouldAutoRotate) return;

    this.cameraController.addLatLon(0, this.rotateSpeed * delta);
  }
}
