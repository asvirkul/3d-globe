import * as THREE from 'three';
import type { Controller } from '../../engine/GlobeEngine';
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

export class CameraController implements Controller {
  private camera: THREE.PerspectiveCamera;
  private radius: number;

  private readonly baseFov = 45;
  private readonly maxAdaptiveFov = 68;
  private readonly fovStep = 1.5;

  private target = new THREE.Vector3();
  private currentTarget = new THREE.Vector3();

  private currentDistance: number;
  private targetDistance: number;
  
  private defMinDistance = 0;
  private defMaxDistance = 0; 

  private minDistance = 0;
  private maxDistance = 0;

  private damping: number;
  private lat = 0;
  private lon = 0;

  private minLat: number;
  private maxLat: number;  

  constructor(
    camera: THREE.PerspectiveCamera,
    options: CameraControllerOptions,
  ) {
    this.camera = camera;
    this.radius = options.radius;
    
    this.defMinDistance = options.minDistance ?? this.radius * 1.5;
    this.defMaxDistance = options.maxDistance ?? this.radius * 3.5;

    const startDistance = options.distance ?? this.radius * 2.5;

    this.currentDistance = startDistance;
    this.targetDistance = startDistance;

    this.damping = options.damping ?? 0.08;

    this.minLat = options.minLat ?? -85;
    this.maxLat = options.maxLat ?? 85;

    this.setLatLon(0, 0);

    this.currentTarget.copy(this.target);
    this.camera.position.set(0, 0, this.currentDistance);
    this.camera.lookAt(0, 0, 0);
    this.recomputeDistanceLimits();
  }

  private getFitMinDistance(
    radius: number,
    fovDeg: number,
    aspect: number,
    padding = 1.06 
  ): number {
    const vHalf = THREE.MathUtils.degToRad(fovDeg * 0.5);
    const hHalf = Math.atan(Math.tan(vHalf) * aspect);
    const limitingHalfFov = Math.max(Math.min(vHalf, hHalf), 1e-3);
    return (radius / Math.sin(limitingHalfFov)) * padding;
  }

  private recomputeDistanceLimits(): void {
    const baseMin = this.defMinDistance;
    const baseMax = this.defMaxDistance;

    let nextFov = this.baseFov;
    let fitMin = this.getFitMinDistance(this.radius, nextFov, this.camera.aspect, 1.06);

    while (fitMin > baseMax && nextFov < this.maxAdaptiveFov) {
        nextFov = Math.min(this.maxAdaptiveFov, nextFov + this.fovStep);
        fitMin = this.getFitMinDistance(this.radius, nextFov, this.camera.aspect, 1.06);
    }

    const nextMin = baseMin;
    const nextMax = Math.max(baseMax, fitMin); 

    this.camera.fov = nextFov;
    this.camera.updateProjectionMatrix();

    this.minDistance = nextMin;
    this.maxDistance = nextMax;

    const enforcedMin = Math.max(fitMin, this.minDistance);
    this.targetDistance = THREE.MathUtils.clamp(Math.max(this.targetDistance, enforcedMin), this.minDistance, this.maxDistance);
    this.currentDistance = THREE.MathUtils.clamp(Math.max(this.currentDistance, enforcedMin), this.minDistance, this.maxDistance);
  }

  public onResize(_width: number, _height: number): void {
    this.recomputeDistanceLimits();
  }

  public getMinDistance(): number {
    return this.minDistance;
  }
  
  public getBaseFov(): number {
    return this.baseFov;
  }

  public lookAtLatLon(lat: number, lon: number): void {
    this.setLatLon(lat, lon);
    this.currentTarget.copy(this.target);
  }

  public flyToLatLon(lat: number, lon: number, distance?: number): void {
    this.setLatLon(lat, lon);
    this.setDistance(distance ?? this.minDistance);
  }

  public addLatLon(dLat: number, dLon: number = 0): void {
    this.setLatLon(this.lat - dLat, this.lon + dLon);
  }
  
  public addDistance(delta: number): void {
    this.targetDistance += delta;

    this.targetDistance = THREE.MathUtils.clamp(
        this.targetDistance,
        this.minDistance,
        this.maxDistance
    );
    }

  public setDistance(distance: number): void {
    this.targetDistance = THREE.MathUtils.clamp(
        distance,
        this.minDistance,
        this.maxDistance
    );
  }

  public getDistance(): number {
    return this.currentDistance;
  }

  public getZoomNormalized(): number {
    const range = this.defMaxDistance - this.defMinDistance;
    if (range <= Number.EPSILON) return 0;
    return THREE.MathUtils.clamp((this.currentDistance - this.defMinDistance) / range, 0, 1);
  }


  private setLatLon(lat: number, lon: number): void {
    this.lat = THREE.MathUtils.clamp(lat, this.minLat, this.maxLat);
    this.lon = lon;

    this.target.copy(
      lon2xyz(this.lat, this.lon, this.radius)
    );
  }

  public update(delta: number): void {
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
