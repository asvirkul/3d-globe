import * as THREE from 'three';
import { CameraController } from './CameraController';

export class CloudController {
  private cameraController: CameraController;
  private clouds: THREE.Object3D;

  constructor(
    cameraController: CameraController,
    clouds: THREE.Object3D
  ) {
    this.cameraController = cameraController;
    this.clouds = clouds;
  }

  update() {
    const base = this.clouds.getObjectByName('CloudsBase') as THREE.Mesh;
    const over = this.clouds.getObjectByName('CloudsOvercast') as THREE.Mesh;
    if (!base || !over) return;

    const baseMat = base.material as THREE.ShaderMaterial;
    const overMat = over.material as THREE.ShaderMaterial;
    const t = this.cameraController.getZoomNormalized();

    const baseFade = THREE.MathUtils.lerp(0.3, 1.0, t);

    const overFade = t;

    baseMat.uniforms.haze.value = baseFade;
    overMat.uniforms.haze.value = overFade;

    baseMat.uniforms.density.value = THREE.MathUtils.lerp(1.0, 2.0, t);
    overMat.uniforms.density.value = THREE.MathUtils.lerp(1.2, 2.7, t);

  }
}
