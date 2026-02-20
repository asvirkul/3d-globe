import * as THREE from 'three';

export type EarthOptions = {
  radius?: number;
  widthSegments?: number;
  heightSegments?: number;
  texture?: THREE.Texture;
  withAtmosphere?: boolean;
};

export function createEarth(options: EarthOptions = {}): THREE.Group {
  const {
    radius = 200,
    widthSegments = 64,
    heightSegments = 64,
    texture,
    withAtmosphere = true,
  } = options;

  const group = new THREE.Group();
  group.name = 'EarthGroup';

  const geometry = new THREE.SphereGeometry(
    radius,
    widthSegments,
    heightSegments
  );

  const material = new THREE.MeshStandardMaterial({
    map: texture,
  });

  const earthMesh = new THREE.Mesh(geometry, material);
  earthMesh.name = 'Earth';
  group.add(earthMesh);

  if (withAtmosphere) {
    const atmosphereGeometry = new THREE.SphereGeometry(
      radius * 1.03,
      widthSegments,
      heightSegments
    );

    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        glowColor: { value: new THREE.Color(0x4fa3ff) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.8 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
      `,
    });

    const atmosphereMesh = new THREE.Mesh(
      atmosphereGeometry,
      atmosphereMaterial
    );

    atmosphereMesh.name = 'Atmosphere';
    group.add(atmosphereMesh);
  }

  return group;
}
