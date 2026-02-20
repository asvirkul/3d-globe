import * as THREE from 'three';
import { lon2xyz } from '../utils/geo';

export type CameraControllerOptions = {
  radius: number;
  distance?: number;
  damping?: number;
  minLat?: number;
  maxLat?: number;
  minDistance?: number;
  maxDistance?: number;
};

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private radius: number;

  private target = new THREE.Vector3();
  private currentTarget = new THREE.Vector3();

  private currentDistance: number;
  private targetDistance: number;

  private minDistance: number;
  private maxDistance: number;
  private damping: number;

  private lat = 0;
  private lon = 0;

  private minLat: number;
  private maxLat: number;

  constructor(
    camera: THREE.PerspectiveCamera,
    options: CameraControllerOptions
  ) {
    this.camera = camera;
    this.radius = options.radius;

    const startDistance = options.distance ?? this.radius * 2.5;

    this.currentDistance = startDistance;
    this.targetDistance = startDistance;

    this.minDistance = options.minDistance ?? this.radius * 1.5;
    this.maxDistance = options.maxDistance ?? this.radius * 3.5;

    this.damping = options.damping ?? 0.08;

    this.minLat = options.minLat ?? -85;
    this.maxLat = options.maxLat ?? 85;

    this.setLatLon(0, 0);

    this.currentTarget.copy(this.target);
    this.camera.position.set(0, 0, this.currentDistance);
    this.camera.lookAt(0, 0, 0);
  }

  public lookAtLatLon(lat: number, lon: number) {
    this.setLatLon(lat, lon);
    this.currentTarget.copy(this.target);
  }

  public flyToLatLon(lat: number, lon: number) {
    this.setLatLon(lat, lon);
  }

  public addLatLon(dLat: number, dLon: number = 0) {
    this.setLatLon(this.lat - dLat, this.lon + dLon);
  }
  
  public addDistance(delta: number) {
    this.targetDistance += delta;

    this.targetDistance = THREE.MathUtils.clamp(
        this.targetDistance,
        this.minDistance,
        this.maxDistance
    );
    }

   public setDistance(distance: number) {
    this.targetDistance = THREE.MathUtils.clamp(
        distance,
        this.minDistance,
        this.maxDistance
    );
    }

   public getDistance() {
    return this.currentDistance;
   }

   public getZoomNormalized(): number {
    return THREE.MathUtils.clamp(
        (this.currentDistance - this.minDistance) /
        (this.maxDistance - this.minDistance),
        0,
        1
    );
    }

  private setLatLon(lat: number, lon: number) {
    this.lat = THREE.MathUtils.clamp(lat, this.minLat, this.maxLat);
    this.lon = lon;

    this.target.copy(
      lon2xyz(this.lat, this.lon, this.radius)
    );
  }

  public update(delta: number) {
    const t = 1 - Math.exp(-this.damping * delta);

    this.currentTarget.lerp(this.target, t);

    this.currentDistance = THREE.MathUtils.lerp(
        this.currentDistance,
        this.targetDistance,
        t
    );

    const direction = this.currentTarget.clone().normalize();
    const position = direction.multiplyScalar(this.currentDistance);

    this.camera.position.copy(position);
    this.camera.lookAt(0, 0, 0);
  }
}
