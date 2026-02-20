import * as THREE from 'three';

export function lon2xyz(
  lat: number,
  lon: number,
  radius: number
): THREE.Vector3 {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z =  radius * Math.sin(phi) * Math.sin(theta);
  const y =  radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

export function xyz2lon(
  position: THREE.Vector3
): { lat: number; lon: number } {
  const radius = position.length();

  const lat = 90 - (Math.acos(position.y / radius) * 180) / Math.PI;
  const lon = (Math.atan2(position.z, -position.x) * 180) / Math.PI - 180;

  return { lat, lon };
}

export function getCirclePoints(
  center: THREE.Vector3,
  radius: number,
  segments = 64
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];

  const normal = center.clone().normalize();
  const tangent = new THREE.Vector3(1, 0, 0);

  if (Math.abs(normal.dot(tangent)) > 0.9) {
    tangent.set(0, 1, 0);
  }

  const bitangent = new THREE.Vector3()
    .crossVectors(normal, tangent)
    .normalize();

  const correctedTangent = new THREE.Vector3()
    .crossVectors(bitangent, normal)
    .normalize();

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;

    const point = center.clone()
      .add(
        correctedTangent.clone().multiplyScalar(Math.cos(angle) * radius)
      )
      .add(
        bitangent.clone().multiplyScalar(Math.sin(angle) * radius)
      );

    points.push(point);
  }

  return points;
}
