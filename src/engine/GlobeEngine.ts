import * as THREE from 'three';

export class GlobeEngine {
  private controllers: Array<{ update(delta: number): void }> = [];
  private lastTime = performance.now();
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private rafId: number | null = null;


  
  private resize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
      alpha: true
    });

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.setupLighting();

    container.appendChild(this.renderer.domElement);
    window.addEventListener('resize', this.resize);
    this.resize();
    
  }

  private setupLighting() {

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(6, 4, 6);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x6f9bff, 0.7);
    fill.position.set(-6, 2, -4);
    this.scene.add(fill);

    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    this.scene.add(ambient);
  }



  public addController(controller: { update(delta: number): void }) {
    this.controllers.push(controller);
  }

  public start() {
    if (this.rafId === null) {
      this.render();
    }
  }

  public stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public warmup() {
     this.renderer.compile(this.scene, this.camera);
     this.renderer.render(this.scene, this.camera);
  }

  public add(object: THREE.Object3D) {
    this.scene.add(object);
  }

  public remove(object: THREE.Object3D) {
    this.scene.remove(object);
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.resize);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
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

  private render = () => {
    const now = performance.now();
    const rawDelta = (now - this.lastTime) / 16.666;
    const delta = Math.min(rawDelta, 2);
    this.lastTime = now;
    this.controllers.forEach(c => c.update(delta));


    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this.render);
  };
  
}
