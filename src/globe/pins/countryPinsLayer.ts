import * as THREE from 'three';
import type {
  PinEntry,
  CountryPinData,
  ScreenRect,
  PinsLayoutState,
  PinsLayoutContext,
} from './types';
import type { CountriesMap } from '../borders/types';
import { lon2xyz } from '../../engine/utils/geo';
import { isValidCoord } from '../geo/geo';
import { resolvePinPlacement } from './countryPinPlacement';
import { PINS_CONFIG } from './config';

export type CountryPinsLayerOptions = {
  canShow: () => boolean;
  container: HTMLElement;
  getLabelRectsByIso: () => ReadonlyMap<string, ScreenRect>;
  setHiddenByPins: (isoSet: ReadonlySet<string>) => void;
  texture: THREE.Texture;
};

export class CountryPinsLayer {
  private entries: PinEntry[] = [];
  private group = new THREE.Group();
  private static readonly FADE_SPEED = 4;
  private readonly cameraRight = new THREE.Vector3();
  private readonly cameraUp = new THREE.Vector3();
  private readonly pinsLayoutContext: PinsLayoutContext;
  private readonly pinScreenSize = PINS_CONFIG.screenSize;
  private readonly proj = new THREE.Matrix4();
  private readonly frustum = new THREE.Frustum();
  private readonly worldPos = new THREE.Vector3();
  private readonly camDir = new THREE.Vector3();
  private readonly normal = new THREE.Vector3();
  private readonly hiddenByPins = new Set<string>();
  private readonly pinsByIso = new Map<string, PinEntry>();

  constructor(
    private countries: CountriesMap,
    private pins: CountryPinData,
    private camera: THREE.PerspectiveCamera,
    private radius: number,
    private options: CountryPinsLayerOptions
  ) {
    this.pinsLayoutContext = {
      camera: this.camera,
      group: this.group,
      radius: this.radius,
      pinScreenSize: this.pinScreenSize,
      pinsScratch: {
        worldAnchor: new THREE.Vector3(),
        worldPosition: new THREE.Vector3(),
        localPosition: new THREE.Vector3(),
      },
    };
    this.entries = this.buildPinEntries();
  }

  private buildPinEntries(): PinEntry[] {
    const pinEntries: PinEntry[] = [];
    this.group.name = 'CountryPins';
    for (const iso in this.pins) {
      const meta = this.pins[iso];

      const country = this.countries.get(iso);

      if (!country) continue;

      const pinLat = country.properties.label_lat;
      const pinLon = country.properties.label_lon;

      if (pinLat === undefined || pinLon === undefined) continue;
      if (!isValidCoord(pinLon, pinLat)) continue;

      const anchor = lon2xyz(pinLat, pinLon, this.radius);

      const object = this.createPinSprite();

      object.position.copy(anchor);
      this.group.add(object);

      const entry: PinEntry = {
        iso,
        meta,
        anchor,
        object,
        visible: false,
        opacity: 0,
        targetOpacity: 0,
        hasPlacement: false,
      };

      pinEntries.push(entry);
      this.pinsByIso.set(iso, entry);
    }
    return pinEntries;
  }

  private get pinWorldSize(): number {
    return this.radius * PINS_CONFIG.worldSizeFactor;
  }

  public get object3d(): THREE.Group {
    return this.group;
  }

  public getPinEntryByIso(iso: string): PinEntry | undefined {
    return this.pinsByIso.get(iso);
  }

  private createPinSprite(): THREE.Sprite {
    const texture = this.options.texture;
    const material = new THREE.SpriteMaterial({
      color: '#ffffff',
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0,
      toneMapped: false,
      map: texture,
    });
    const pinSprite = new THREE.Sprite(material);

    pinSprite.scale.set(this.pinWorldSize * PINS_CONFIG.iconAspect, this.pinWorldSize, 1);
    pinSprite.visible = false;

    return pinSprite;
  }

  private intersects(a: ScreenRect, b: ScreenRect): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  private createLayoutState(): PinsLayoutState | null {
    const viewportW = this.options.container.clientWidth;
    const viewportH = this.options.container.clientHeight;

    if (viewportW <= 0 || viewportH <= 0) return null;

    this.cameraRight.setFromMatrixColumn(this.camera.matrixWorld, 0);
    this.cameraUp.setFromMatrixColumn(this.camera.matrixWorld, 1);

    const labelRectsByIso = this.options.getLabelRectsByIso();

    return {
      viewportW,
      viewportH,
      cameraRight: this.cameraRight,
      cameraUp: this.cameraUp,
      labelRectsByIso,
    };
  }

  private computeHorizonDot(): number {
    const camDist = this.camera.position.length();
    if (camDist <= this.radius) return 1;
    const base = this.radius / camDist;

    const margin = PINS_CONFIG.margin;
    const maxDot = PINS_CONFIG.maxDot;

    return THREE.MathUtils.clamp(base + margin, 0, maxDot);
  }

  private getWorldPos(entry: PinEntry): THREE.Vector3 {
    return this.worldPos.copy(entry.anchor).applyMatrix4(this.group.matrixWorld);
  }

  private isPinInFrustum(entry: PinEntry): boolean {
    return this.frustum.containsPoint(this.getWorldPos(entry));
  }

  private isPinOverHorizon(entry: PinEntry): boolean {
    const normal = this.normal.copy(this.getWorldPos(entry)).normalize();
    const cameraDir = this.camDir.copy(this.camera.position).normalize();

    const horizonDot = normal.dot(cameraDir);

    return horizonDot > this.computeHorizonDot();
  }

  private layoutPins(state: PinsLayoutState): void {
    this.hiddenByPins.clear();
    this.group.updateWorldMatrix(true, false);

    this.proj.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.proj);

    for (const entry of this.entries) {
      if (!this.isPinInFrustum(entry) || !this.isPinOverHorizon(entry)) {
        entry.hasPlacement = false;
        entry.targetOpacity = 0;
        continue;
      }

      const placement = resolvePinPlacement(entry, state, this.pinsLayoutContext);
      if (!placement) {
        entry.hasPlacement = false;
        entry.targetOpacity = 0;
        continue;
      }

      for (const [iso, rect] of state.labelRectsByIso) {
        if (iso === entry.iso) continue;
        if (this.intersects(placement.pinRect, rect)) {
          this.hiddenByPins.add(iso);
        }
      }

      entry.object.position.copy(placement.position);
      entry.hasPlacement = true;
      entry.targetOpacity = 1;
    }
    this.options.setHiddenByPins(this.hiddenByPins);
  }

  public updateOpacity(delta: number): void {
    const deltaSec = delta / 60;
    const k = 1 - Math.exp(-CountryPinsLayer.FADE_SPEED * deltaSec);
    for (const entry of this.entries) {
      entry.opacity = THREE.MathUtils.lerp(entry.opacity, entry.targetOpacity, k);

      const isOpacityVisible = entry.opacity > 0.01 || entry.targetOpacity > 0;
      entry.object.visible = isOpacityVisible;

      if (isOpacityVisible) {
        entry.object.material.opacity = entry.opacity;
      }

      if (Math.abs(entry.opacity - entry.targetOpacity) <= 0.001) {
        entry.opacity = entry.targetOpacity;
      }

      entry.visible = entry.object.visible;
    }
  }

  public updateVisibility(): void {
    const canShow = this.options.canShow();

    if (!canShow) {
      this.hiddenByPins.clear();
      this.options.setHiddenByPins(this.hiddenByPins);
      for (const entry of this.entries) {
        entry.targetOpacity = 0;
        entry.hasPlacement = false;
      }
      return;
    }

    const state = this.createLayoutState();
    if (!state) {
      this.hiddenByPins.clear();
      this.options.setHiddenByPins(this.hiddenByPins);
      return;
    }

    this.layoutPins(state);
  }

  public dispose(): void {
    for (const entry of this.entries) {
      entry.object.material.dispose();
    }

    this.group.clear();
    this.pinsByIso.clear();
    this.entries = [];
  }
}
