import { CameraController } from "./CameraController";
import type { Controller } from "../GlobeEngine";

export type EarthControllerOptions = {
  autoRotate?: boolean;
  rotateSpeed?: number;
};

export class EarthController implements Controller {
  private cameraController: CameraController;
  private autoRotate: boolean;
  private rotateSpeed: number;
  private initialAutoRotate: boolean;

  constructor(
    cameraController: CameraController,
    options: EarthControllerOptions = {}
  ) {
    this.cameraController = cameraController;

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

  public update(delta: number): void {
    if (!this.autoRotate) return;

    this.cameraController.addLatLon(0, this.rotateSpeed * delta);
  }
}
