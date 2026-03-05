import * as THREE from 'three';
import type { Controller } from '../GlobeEngine';

export class LightController implements Controller {
  private material: THREE.ShaderMaterial;
  private time = 0;

  constructor(material: THREE.ShaderMaterial) {
    this.material = material;
  }

  update(delta: number): void {
    this.time += delta * 0.05;

    const pulse = 0.75 + 0.25 * Math.sin(this.time);

    this.material.uniforms.opacity.value = pulse;
  }
}
