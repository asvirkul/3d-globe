import * as THREE from 'three';
import vertexShader from '../shaders/clouds/vertex.glsl';
import fragmentShader from '../shaders/clouds/fragment.glsl';

export type CloudsOptions = {
  radius: number;
  texture: THREE.Texture;
  opacity?: number;
  scale?: number;
};

export function createClouds( renderer: THREE.WebGLRenderer, options: CloudsOptions): THREE.Mesh {
  const {
    radius,
    texture,
    opacity = 0.85,
    scale = 1.01,
  } = options;

  const geometry = new THREE.SphereGeometry(
    radius * scale,
    64,
    64
  );

  const map = texture;
  
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const material = new THREE.ShaderMaterial({
    uniforms: {
        cloudMap: { value: map },
        density: { value: 0.5 },
        opacity: { value: opacity },
        haze: { value: 1 }   
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    });

  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}


export type CloudLayersOptions = {
  radius: number;
  texture: THREE.Texture;
  baseOpacity?: number;
  overcastOpacity?: number;
};

export function createCloudLayers(
  renderer: THREE.WebGLRenderer,
  options: CloudLayersOptions
): THREE.Group {
  const {
    radius,
    texture,
    baseOpacity = 0.85,
    overcastOpacity = 0.65,
  } = options;

  const group = new THREE.Group();
  group.name = 'CloudLayers';

  const base = createClouds(renderer,{
    radius,
    texture,
    opacity: baseOpacity,
    scale: 1.01,
  });

  base.name = 'CloudsBase';
  base.renderOrder = 10;

    const overcast = createClouds(renderer, {
    radius,
    texture,
    opacity: overcastOpacity,
    scale: 1.013,
    });

  overcast.name = 'CloudsOvercast';
  overcast.rotation.y = Math.PI / 4;
  overcast.renderOrder = 11;

  group.add(base);
  group.add(overcast);

  return group;
}
