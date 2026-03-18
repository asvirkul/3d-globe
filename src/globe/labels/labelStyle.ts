import * as THREE from 'three'; 

export function dampColor(
  out: THREE.Color,
  target: THREE.Color,
  lambda: number,
  dt: number
): void {
  out.r = THREE.MathUtils.damp(out.r, target.r, lambda, dt);
  out.g = THREE.MathUtils.damp(out.g, target.g, lambda, dt);
  out.b = THREE.MathUtils.damp(out.b, target.b, lambda, dt);
};

export function isColorNear(a: THREE.Color, b: THREE.Color, eps = 0.001): boolean {
  return (
    Math.abs(a.r - b.r) < eps &&
    Math.abs(a.g - b.g) < eps &&
    Math.abs(a.b - b.b) < eps
  );
}