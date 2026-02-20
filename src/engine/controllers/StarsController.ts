import * as THREE from 'three';
import { CameraController } from './CameraController';

export class StarsController {

  private time = 0;

  constructor(
    private stars: THREE.Points,
    private camera: THREE.Camera,
    private cameraController: CameraController
  ) {}

  update(delta: number) {

    this.stars.position.copy(this.camera.position);

    const zoom = this.cameraController.getZoomNormalized();

    const scale = 1 + zoom * 0.15;
    this.stars.scale.setScalar(scale);

    const material = this.stars.material as THREE.ShaderMaterial;

    if (material.uniforms?.uOpacity) {
      material.uniforms.uOpacity.value = THREE.MathUtils.lerp(0.2, 1.0, zoom);
    }

    this.stars.rotation.y += 0.00002 * delta;

    this.time += delta;

    if (material.uniforms?.uTime) {
      material.uniforms.uTime.value = this.time;
    }
  }
}