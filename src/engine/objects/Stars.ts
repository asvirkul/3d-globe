import * as THREE from 'three';
import starsVertex from '../shaders/stars/vertex.glsl';
import starsFragment from '../shaders/stars/fragment.glsl';

export type StarsOptions = {
  radius: number;
  fov: number;
  screenHeight: number;
  count?: number;
  minSize?: number;
  maxSize?: number;
  depthSpread?: number;
};


export function createStars(options: StarsOptions): THREE.Points {

    const {
    count = 1000,
    radius,
    minSize = 1,
    maxSize = 5,
    depthSpread = 0.2
    } = options;


  const geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const intensities = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    
    const u = Math.random();
    const v = Math.random();

    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);

    const r = radius * (1 - depthSpread + Math.random() * depthSpread);

    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const s = Math.pow(Math.random(), 3.0);

    const size = THREE.MathUtils.lerp(minSize, maxSize * 3.0, s);
    sizes[i] = size;

    intensities[i] = 0.5 + (size / (maxSize * 3.0));
    
    const t = Math.random();
    if (t < 0.7) {
        colors[i * 3]     = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
    } 
    else if (t < 0.9) {
        colors[i * 3]     = 0.7;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 1.0;
    } 
    else {
        colors[i * 3]     = 1.0;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 0.6;
    }
  }

  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
  );

  geometry.setAttribute(
    'aSize',
    new THREE.BufferAttribute(sizes, 1)
  );
  geometry.setAttribute(
    'aColor',
    new THREE.BufferAttribute(colors, 3)
  );
  geometry.setAttribute(
    'aIntensity',
    new THREE.BufferAttribute(intensities, 1)
  );


const material = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  depthTest: true,
  blending: THREE.AdditiveBlending,

  uniforms: {
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uFov: { value: options.fov },
    uScreenHeight: { value: options.screenHeight }
  },
  vertexShader: starsVertex,
  fragmentShader: starsFragment,
});

  const stars = new THREE.Points(geometry, material);
  stars.name = 'Stars';
  stars.frustumCulled = false;

  return stars;
}