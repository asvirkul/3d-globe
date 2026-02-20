import { CameraController } from './CameraController';

export class OrbitController {
  private cameraController: CameraController;
  private dom: HTMLElement;
  private pointers = new Map<number, PointerEvent>();

  private lastRotate = { x: 0, y: 0 };
  private lastPinchDistance: number | null = null;
  private zoomSpeed = 0.05;
  private sensitivity = 0.6;

  public onStartDrag?: () => void;
  public onEndDrag?: () => void;

  

  constructor(
    cameraController: CameraController,
    dom: HTMLElement
  ) {
    this.cameraController = cameraController;
    this.dom = dom;

    dom.addEventListener('pointerdown', this.onDown);
    dom.addEventListener('pointermove', this.onMove);
    dom.addEventListener('pointerup', this.onUp);
    dom.addEventListener('pointercancel', this.onUp);
    dom.addEventListener('pointerleave', this.onUp);
    dom.addEventListener('wheel', this.onWheel, { passive: false });
  }
  
  private onDown = (e: PointerEvent) => {
    this.pointers.set(e.pointerId, e);
    this.dom.setPointerCapture(e.pointerId);

    if (this.pointers.size === 1) {
        this.lastRotate.x = e.clientX;
        this.lastRotate.y = e.clientY;
        this.onStartDrag?.();
    }

    if (this.pointers.size === 2) {
        this.lastPinchDistance = this.getPinchDistance();
    }
  };

  private onMove = (e: PointerEvent) => {
    if (!this.pointers.has(e.pointerId)) return;

    this.pointers.set(e.pointerId, e);

    const count = this.pointers.size;

    if (count === 1) {
        const dx = e.clientX - this.lastRotate.x;
        const dy = e.clientY - this.lastRotate.y;

        this.lastRotate.x = e.clientX;
        this.lastRotate.y = e.clientY;

        this.cameraController.addLatLon(
            -dy * this.sensitivity,
            -dx * this.sensitivity
        );
    }

    if (count === 2) {
        const distance = this.getPinchDistance();

        if (this.lastPinchDistance !== null) {
            const delta = distance - this.lastPinchDistance;
            const camDistance = this.cameraController.getDistance();

            this.cameraController.addDistance(
                -delta * this.zoomSpeed * 0.04 * camDistance
            );
        }

        this.lastPinchDistance = distance;
    }
  };


  private onUp = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId);
    this.dom.releasePointerCapture(e.pointerId);

    if (this.pointers.size < 2) {
        this.lastPinchDistance = null;
    }

    if (this.pointers.size === 0) {
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

  public update() {}
}
