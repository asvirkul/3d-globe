import * as THREE from 'three';
import type { PinEntry, CountryPinData, ScreenRect, PinPlacement } from './types';
import type { CountriesMap } from '../borders/types';
import { lon2xyz } from '../../engine/utils/geo';
import { isValidCoord } from '../geo/geo';
import type { VisibleLabelRect } from '../labels/types';

export type CountryPinsLayerOptions = {
  canShow: () => boolean;
  container: HTMLElement;
  getVisibleLabelRects: () => readonly VisibleLabelRect[];
  getLabelRect: (iso: string) => ScreenRect | null;
};

export class CountryPinsLayer {
  private entries: PinEntry[] = [];
  private group = new THREE.Group();
  private static readonly FADE_SPEED = 4;
  private readonly cameraRight = new THREE.Vector3();
  private readonly cameraUp = new THREE.Vector3();
  private readonly worldPosition = new THREE.Vector3();
  private readonly worldAnchor = new THREE.Vector3();

  constructor(
    private countries: CountriesMap,
    private pins: CountryPinData,
    private camera: THREE.PerspectiveCamera,
    private radius: number,
    private options: CountryPinsLayerOptions
  ) {
    this.entries = this.buildPinEntries();
  }

  private readonly pinScreenSize = 16; // px

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

      pinEntries.push({
        iso,
        meta,
        anchor,
        object,
        visible: false,
        opacity: 0,
        targetOpacity: 0,
        hasPlacement: false,
      });
    }
    return pinEntries;
  }

  private get pinWorldSize(): number {
    return this.radius * 0.01;
  }

  public get object3d(): THREE.Group {
    return this.group;
  }

  private createPinSprite(): THREE.Sprite {
    const material = new THREE.SpriteMaterial({
      color: '#ffffff',
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0,
      toneMapped: false,
    });
    const pinSprite = new THREE.Sprite(material);

    pinSprite.scale.set(this.pinWorldSize, this.pinWorldSize, 1);
    pinSprite.visible = false;

    return pinSprite;
  }

  private intersects(a: ScreenRect, b: ScreenRect): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  private createVisibleRectMap(
    labelRects: readonly VisibleLabelRect[]
  ): ReadonlyMap<string, ScreenRect> {
    return new Map(labelRects.map((item) => [item.iso, item.rect]));
  }

  private resolvePinPlacement(
    entry: PinEntry,
    visibleRectsByIso: ReadonlyMap<string, ScreenRect>
  ): PinPlacement | null {
    const labelRect = visibleRectsByIso.get(entry.iso) ?? this.options.getLabelRect(entry.iso);

    if (!labelRect) return null;

    const gapY = -(5 + this.pinScreenSize * 0.5);
    const gapX = 0;

    const x = labelRect.x + labelRect.w * 0.5;
    const y = labelRect.y + gapY;

    const viewportW = this.options.container.clientWidth;
    const viewportH = this.options.container.clientHeight;

    const fitsViewport =
      x - this.pinScreenSize * 0.5 >= 0 &&
      x + this.pinScreenSize * 0.5 <= viewportW &&
      y - this.pinScreenSize * 0.5 >= 0 &&
      y + this.pinScreenSize * 0.5 <= viewportH;

    if (!fitsViewport) return null;

    const worldAnchor = this.worldAnchor.copy(entry.anchor).applyMatrix4(this.group.matrixWorld);
    const rawDistance = this.camera.position.distanceTo(worldAnchor);
    const baseDistance = this.radius;
    const distance = THREE.MathUtils.lerp(baseDistance, rawDistance, 0.35);

    const worldHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const worldWidth = worldHeight * this.camera.aspect;

    const worldUnitPerPixelX = worldWidth / viewportW;
    const worldUnitPerPixelY = worldHeight / viewportH;

    this.cameraRight.setFromMatrixColumn(this.camera.matrixWorld, 0);
    this.cameraUp.setFromMatrixColumn(this.camera.matrixWorld, 1);

    const localPos = this.worldPosition
      .copy(worldAnchor)
      .addScaledVector(this.cameraRight, gapX * worldUnitPerPixelX)
      .addScaledVector(this.cameraUp, -gapY * worldUnitPerPixelY);

    this.group.worldToLocal(localPos);

    return {
      visible: true,
      position: localPos.clone(),
    };
  }

  private layoutPins(
    visibleRectsByIso: ReadonlyMap<string, ScreenRect>
  ): void {
    for (const entry of this.entries) {
      const placement = this.resolvePinPlacement(entry, visibleRectsByIso);
      if (!placement) {
        entry.hasPlacement = false;
        entry.targetOpacity = 0;
        continue;
      }

      entry.object.position.copy(placement.position);
      entry.hasPlacement = true;
      entry.targetOpacity = 1;
    }
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
      for (const entry of this.entries) {
        entry.targetOpacity = 0;
        entry.hasPlacement = false;
      }
      return;
    }

    const visibleLabelRects = this.options.getVisibleLabelRects();
    const visibleRectsByIso = this.createVisibleRectMap(visibleLabelRects);

    if (visibleLabelRects.length === 0) {
      for (const entry of this.entries) {
        entry.targetOpacity = 0;
      }
      return;
    }

    this.layoutPins(visibleRectsByIso);
  }

  public dispose(): void {
    for (const entry of this.entries) {
      entry.object.material.dispose();
    }

    this.group.clear();
    this.entries = [];
  }
}
