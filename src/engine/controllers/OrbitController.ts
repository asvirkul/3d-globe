import * as THREE from 'three';
import { CameraController } from './CameraController';
import type { Controller } from '../GlobeEngine';

export class OrbitController implements Controller {
  private cameraController: CameraController;
  private dom: HTMLElement;
  private pointers = new Map<number, PointerEvent>();
  private lastRotate = { x: 0, y: 0 };
  private lastPinchDistance: number | null = null;
  private zoomSpeed = 0.05;
  private sensitivity = 0.5;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private camera: THREE.PerspectiveCamera;
  private globe: THREE.Object3D;
  private isGlobeDragActive = false;
  private abort = new AbortController();
  public onStartDrag?: () => void;
  public onEndDrag?: () => void;

  constructor(
    cameraController: CameraController,
    dom: HTMLElement,
    globe: THREE.Object3D,
    camera: THREE.PerspectiveCamera
  ) {
    this.cameraController = cameraController;
    this.dom = dom;
    this.globe = globe;
    this.camera = camera;

    dom.addEventListener('pointerdown', this.onDown, { signal: this.abort.signal });
    dom.addEventListener('pointermove', this.onMove, { signal: this.abort.signal });
    dom.addEventListener('pointerup', this.onUp, { signal: this.abort.signal });
    dom.addEventListener('pointercancel', this.onUp, { signal: this.abort.signal });
    dom.addEventListener('pointerleave', this.onUp, { signal: this.abort.signal });
    dom.addEventListener('wheel', this.onWheel, { passive: false, signal: this.abort.signal });
  }

  private onDown = (e: PointerEvent): void => {
    const rect = this.dom.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.pointers.size === 0) {
      const intersects = this.raycaster.intersectObject(this.globe);
      if (intersects.length === 0) return;
    }
    this.pointers.set(e.pointerId, e);
    this.dom.setPointerCapture(e.pointerId);

    if (this.pointers.size === 1) {
      this.lastRotate.x = e.clientX;
      this.lastRotate.y = e.clientY;
      this.isGlobeDragActive = true;
      this.onStartDrag?.();
    }

    if (this.pointers.size === 2) {
      this.lastPinchDistance = this.getPinchDistance();
    }
  };

  private onMove = (e: PointerEvent): void => {
    if (!this.pointers.has(e.pointerId)) return;
    if (!this.isGlobeDragActive) return;

    this.pointers.set(e.pointerId, e);

    const count = this.pointers.size;

    if (count === 1) {
      const dx = e.clientX - this.lastRotate.x;
      const dy = e.clientY - this.lastRotate.y;

      this.lastRotate.x = e.clientX;
      this.lastRotate.y = e.clientY;

      const baseFov = this.cameraController.getBaseFov();
      const fovFactor = this.camera.fov / baseFov;
      const degreesPerPixel = 0.15;
      const zoom = this.cameraController.getZoomNormalized();
      const zoomFactor = THREE.MathUtils.lerp(0.3, 1, zoom);
      const lonDelta = dx * degreesPerPixel * this.sensitivity * fovFactor * zoomFactor;
      const latDelta = dy * degreesPerPixel * this.sensitivity * fovFactor * zoomFactor;

      this.cameraController.addLatLon(-latDelta, -lonDelta);
    }

    if (count === 2) {
      const distance = this.getPinchDistance();

      if (this.lastPinchDistance !== null) {
        const delta = distance - this.lastPinchDistance;
        const camDistance = this.cameraController.getDistance();

        this.cameraController.addDistance(-delta * this.zoomSpeed * 0.04 * camDistance);
      }

      this.lastPinchDistance = distance;
    }
  };

  private onUp = (e: PointerEvent): void => {
    if (!this.pointers.has(e.pointerId)) return;

    this.pointers.delete(e.pointerId);
    this.dom.releasePointerCapture(e.pointerId);

    if (this.pointers.size < 2) {
      this.lastPinchDistance = null;
    }

    if (this.pointers.size === 0) {
      this.isGlobeDragActive = false;
      this.onEndDrag?.();
    }

    if (this.pointers.size === 1) {
      const remaining = Array.from(this.pointers.values())[0];
      this.lastRotate.x = remaining.clientX;
      this.lastRotate.y = remaining.clientY;
    }
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();

    const direction = e.deltaY > 0 ? 1 : -1;

    const distance = this.cameraController.getDistance();

    const zoomAmount = direction * distance * this.zoomSpeed;

    this.cameraController.addDistance(zoomAmount);
  };

  private getPinchDistance(): number {
    const [p1, p2] = Array.from(this.pointers.values());

    const dx = p1.clientX - p2.clientX;
    const dy = p1.clientY - p2.clientY;

    return Math.sqrt(dx * dx + dy * dy);
  }

  public dispose(): void {
    this.abort.abort();
    this.pointers.clear();
    this.lastPinchDistance = null;
    this.isGlobeDragActive = false;
  }

  public update(_delta: number): void {}
}
