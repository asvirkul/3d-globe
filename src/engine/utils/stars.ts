import * as THREE from 'three';

export function computeStarsRadius(
  camera: THREE.PerspectiveCamera,
  margin = 0.9
): number {
  return camera.far * margin;
}