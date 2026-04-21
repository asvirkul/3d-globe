import * as THREE from 'three';

export interface Controller {
  update(delta: number): void;
  onResize?(width: number, height: number): void;
  dispose?(): void;
}

export class GlobeEngine {
  private lastTime = performance.now();
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private rafId: number | null = null;
  private resizeObserver?: ResizeObserver;
  private lastWidth = 0;
  private lastHeight = 0;

  private resize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;
    if (width === this.lastWidth && height === this.lastHeight) return;

    this.lastWidth = width;
    this.lastHeight = height;

    this.camera.aspect = width / height;

    this.controllers.forEach((c) => c.onResize?.(width, height));

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();

    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    this.camera.position.z = 500;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.setupLighting();

    container.appendChild(this.renderer.domElement);

    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });

    this.resizeObserver.observe(this.container);
    this.resize();
  }

  private setupLighting(): void {
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(6, 4, 6);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x6f9bff, 0.7);
    fill.position.set(-6, 2, -4);
    this.scene.add(fill);

    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    this.scene.add(ambient);
  }

  private controllers: Controller[] = [];

  public addController(controller: Controller): void {
    this.controllers.push(controller);
  }

  public start(): void {
    if (this.rafId === null) {
      this.lastTime = performance.now();
      this.render();
    }
  }

  public stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public warmup(): void {
    this.renderer.compile(this.scene, this.camera);
    this.renderer.render(this.scene, this.camera);
  }

  public add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  public remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  private hasGeometry(object: THREE.Object3D): object is THREE.Object3D & {
    geometry: { dispose?: () => void };
  } {
    return 'geometry' in object;
  }

  private hasMaterial(object: THREE.Object3D): object is THREE.Object3D & {
    material: THREE.Material | THREE.Material[];
  } {
    return 'material' in object;
  }

  private isTextureLike(value: unknown): value is THREE.Texture {
    return typeof value === 'object' && value !== null && 'isTexture' in value;
  }

  public destroy(): void {
    this.stop();
    this.resizeObserver?.disconnect();
    for (const c of this.controllers) {
      c.dispose?.();
    }
    this.controllers = [];

    this.scene.traverse((obj) => {
      if (this.hasMaterial(obj)) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];

        for (const m of materials) {
          const materialRecord = m as unknown as Record<string, unknown>;

          for (const key in materialRecord) {
            const value = materialRecord[key];
            if (this.isTextureLike(value)) {
              value.dispose();
            }
          }

          m.dispose();
        }
      }
    });

    this.scene.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  private render = (): void => {
    const now = performance.now();
    const rawDelta = (now - this.lastTime) / 16.666;
    const delta = Math.min(rawDelta, 2);
    this.lastTime = now;
    this.controllers.forEach((c) => c.update(delta));

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this.render);
  };
}
