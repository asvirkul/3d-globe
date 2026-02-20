import * as THREE from 'three';
import fragmentShader from '../shaders/lights/fragment.glsl';
import vertexShader from '../shaders/lights/vertex.glsl';

export interface LightLayerOptions {
  radius: number;
  texture: THREE.Texture;
}

export function createLights(renderer: THREE.WebGLRenderer, options: LightLayerOptions) {
  const { radius, texture } = options;

  const geometry = new THREE.SphereGeometry(radius, 64, 64);

  const map = texture;

  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = renderer.capabilities.getMaxAnisotropy();

const material = new THREE.ShaderMaterial({
  uniforms: {
    nightMap: { value: map },   
    opacity: { value: 1.0 } 
  },
  vertexShader,
  fragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});


  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'NightLayer';

  return { mesh, material };
}
