import * as THREE from 'three';
import type { CountriesMap } from '../../globe/borders/types';
import type {
  ScreenRect,
  BlockBounds,
  TroikaTextRenderInfo,
  LabelEntry,
  LabelsFrameState,
  LabelFilter,
  VisibleLabelRect,
} from './types';
import { buildAreaScale, getLabelSizePx, resolveImportance } from './areaScale';
import { createCountryText } from './troikaText';
import { lon2xyz } from '../../engine/utils/geo';
import { dampColor, isColorNear, isTargetNear } from './labelStyle';
import { isValidArea, isValidCoord } from '../geo/geo';

function getBlockBounds(label: TroikaTextRenderInfo): BlockBounds | null {
  return label.textRenderInfo?.blockBounds ?? null;
}

export type CountryLabelsLayerOptions = {
  getZoomNormalized: () => number;
  canInteract?: () => boolean;
  container: HTMLElement;

  farMinImportance?: number;
  nearMinImportance?: number;
  horizonMargin?: number;
  maxHorizonDot?: number;
  maxVisible?: number;
  importanceHysteresis?: number;
  horizonHysteresis?: number;
  filters?: LabelFilter[];
};

export class CountryLabelsLayer {
  private group = new THREE.Group();
  private labels: LabelEntry[] = [];
  private readonly camDir = new THREE.Vector3();
  private readonly frustum = new THREE.Frustum();
  private readonly proj = new THREE.Matrix4();
  private readonly c0 = new THREE.Vector3();
  private readonly c1 = new THREE.Vector3();
  private readonly c2 = new THREE.Vector3();
  private readonly c3 = new THREE.Vector3();
  private readonly worldPos = new THREE.Vector3();
  private readonly _candidateBuffer: LabelEntry[] = [];
  private readonly _stickyBuffer: LabelEntry[] = [];
  private readonly _freshBuffer: LabelEntry[] = [];
  private readonly _acceptedBuffer: LabelEntry[] = [];
  private readonly _tempRectsBuffer: ScreenRect[] = [];
  private readonly _colorAnimatingBuffer: LabelEntry[] = [];
  private readonly _opacityBuffer: LabelEntry[] = [];
  private readonly labelsByIso = new Map<string, LabelEntry>();
  private focusedIso: string | null = null;
  private static readonly FADE_SPEED = 4;

  constructor(
    countries: CountriesMap,
    private camera: THREE.Camera,
    private radius: number,
    private options: CountryLabelsLayerOptions
  ) {
    const areas = [...countries.values()].map((c) => c.properties.area_km2).filter(isValidArea);
    const scale = buildAreaScale(areas);
    this.group.name = 'CountryLabels';

    for (const [, country] of countries) {
      const name = country.properties.name;
      const area = country.properties.area_km2;
      const labelLat = country.properties.label_lat;
      const labelLon = country.properties.label_lon;
      const iso = country.properties.iso_a2;

      if (
        !name ||
        !isValidArea(area) ||
        labelLat === undefined ||
        labelLon === undefined ||
        !isValidCoord(labelLon, labelLat)
      ) {
        continue;
      }

      const importance = resolveImportance(area, scale, country.properties.importance_override);

      const fontPx = getLabelSizePx(area, scale);

      const label = createCountryText(name, fontPx);

      const pos = lon2xyz(labelLat, labelLon, this.radius);

      const normal = pos.clone().normalize();

      label.position.copy(pos);
      this.group.add(label);

      const entry: LabelEntry = {
        iso: iso,
        label: label as TroikaTextRenderInfo,
        normal,
        importance,
        wasAccepted: false,
        opacity: 0,
        targetOpacity: 0,
        color: new THREE.Color('#ffffff'),
        targetColor: new THREE.Color('#ffffff'),
      };

      this.labels.push(entry);
      this.labelsByIso.set(iso, entry);
    }
    this.labels.sort((a, b) => b.importance - a.importance);
  }

  private passWithHysteresis(
    value: number,
    threshold: number,
    wasAccepted: boolean,
    h: number
  ): boolean {
    const enter = threshold;
    const exit = threshold - h;
    return wasAccepted ? value >= exit : value >= enter;
  }

  private intersects(a: ScreenRect, b: ScreenRect): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  private approxLabelRect(
    entry: LabelEntry,
    viewportW: number,
    viewportH: number
  ): ScreenRect | null {
    const bounds = getBlockBounds(entry.label);
    if (!bounds) return null;

    const [minX, minY, maxX, maxY] = bounds;

    this.c0.set(minX, minY, 0).applyMatrix4(entry.label.matrixWorld).project(this.camera);
    this.c1.set(maxX, minY, 0).applyMatrix4(entry.label.matrixWorld).project(this.camera);
    this.c2.set(maxX, maxY, 0).applyMatrix4(entry.label.matrixWorld).project(this.camera);
    this.c3.set(minX, maxY, 0).applyMatrix4(entry.label.matrixWorld).project(this.camera);

    const allOutsideDepth = this.c0.z > 1 && this.c1.z > 1 && this.c2.z > 1 && this.c3.z > 1;
    const allBeforeNear = this.c0.z < -1 && this.c1.z < -1 && this.c2.z < -1 && this.c3.z < -1;

    if (allOutsideDepth || allBeforeNear) return null;

    const toPxX = (x: number) => (x * 0.5 + 0.5) * viewportW;
    const toPxY = (y: number) => (-y * 0.5 + 0.5) * viewportH;

    const x0 = toPxX(this.c0.x),
      y0 = toPxY(this.c0.y);
    const x1 = toPxX(this.c1.x),
      y1 = toPxY(this.c1.y);
    const x2 = toPxX(this.c2.x),
      y2 = toPxY(this.c2.y);
    const x3 = toPxX(this.c3.x),
      y3 = toPxY(this.c3.y);

    const minPxX = Math.min(x0, x1, x2, x3);
    const maxPxX = Math.max(x0, x1, x2, x3);
    const minPxY = Math.min(y0, y1, y2, y3);
    const maxPxY = Math.max(y0, y1, y2, y3);

    const pad = 2; // px
    return {
      x: minPxX - pad,
      y: minPxY - pad,
      w: Math.max(1, maxPxX - minPxX + pad * 2),
      h: Math.max(1, maxPxY - minPxY + pad * 2),
    };
  }

  public getVisibleLabelRects(): readonly VisibleLabelRect[] {
    const viewportW = this.options.container.clientWidth;
    const viewportH = this.options.container.clientHeight;

    if (viewportW <= 0 || viewportH <= 0) return [];

    const rects: VisibleLabelRect[] = [];

    for (const entry of this.labels) {
      if (!entry.wasAccepted || entry.opacity <= 0.01) continue;

      const rect = this.approxLabelRect(entry, viewportW, viewportH);
      if (!rect) continue;

      rects.push({
        iso: entry.iso,
        rect,
      });
    }

    return rects;
  }

  public getLabelRect(iso: string): ScreenRect | null {
    const entry = this.labelsByIso.get(iso);
    if (!entry) return null;

    const viewportH = this.options.container.clientHeight;
    const viewportW = this.options.container.clientWidth;

    if (viewportH <= 0 || viewportW <= 0) return null;

    entry.label.quaternion.copy(this.camera.quaternion);
    entry.label.updateWorldMatrix(false, false);

    return this.approxLabelRect(entry, viewportW, viewportH);
  }

  private hiddenByPins: ReadonlySet<string> = new Set();

  public setHiddenByPins(isoSet: ReadonlySet<string>): void {
    this.hiddenByPins = new Set(isoSet);
  }

  private selectStableVisible(
    candidates: LabelEntry[],
    viewportW: number,
    viewportH: number,
    maxVisible: number
  ): LabelEntry[] {
    this._stickyBuffer.length = 0;
    this._freshBuffer.length = 0;
    this._acceptedBuffer.length = 0;
    this._tempRectsBuffer.length = 0;

    for (const entry of candidates) {
      if (entry.wasAccepted) this._stickyBuffer.push(entry);
      else this._freshBuffer.push(entry);
    }

    const tryTakeFrom = (source: LabelEntry[]): void => {
      for (const entry of source) {
        if (this._acceptedBuffer.length >= maxVisible) break;

        const rect = this.approxLabelRect(entry, viewportW, viewportH);
        if (!rect) continue;

        let collide = false;
        for (let i = 0; i < this._tempRectsBuffer.length; i++) {
          if (this.intersects(rect, this._tempRectsBuffer[i])) {
            collide = true;
            break;
          }
        }
        if (collide) continue;

        this._tempRectsBuffer.push(rect);
        this._acceptedBuffer.push(entry);
      }
    };

    tryTakeFrom(this._stickyBuffer);
    tryTakeFrom(this._freshBuffer);

    return this._acceptedBuffer;
  }

  public setFilters(filters: LabelFilter[]): void {
    this.options.filters = filters;
  }
  private computeMinImportance(zoomNormalized: number): number {
    const z = THREE.MathUtils.clamp(zoomNormalized, 0, 1);
    const far = this.options.farMinImportance ?? 0.8;
    const near = this.options.nearMinImportance ?? 0.15;
    const t = 1 - z;
    return THREE.MathUtils.lerp(far, near, t);
  }

  private computeHorizonDot(): number {
    const camDist = this.camera.position.length();
    if (camDist <= this.radius) return 1;
    const base = this.radius / camDist;

    const margin = this.options.horizonMargin ?? 0.02;
    const maxDot = this.options.maxHorizonDot ?? 0.9; // cos(25°)

    return THREE.MathUtils.clamp(base + margin, 0, maxDot);
  }

  public updateOpacity(delta: number): void {
    const deltaSec = delta / 60;
    const k = 1 - Math.exp(-CountryLabelsLayer.FADE_SPEED * deltaSec);
    for (let i = this._opacityBuffer.length - 1; i >= 0; i--) {
      const entry = this._opacityBuffer[i];
      entry.opacity = THREE.MathUtils.lerp(entry.opacity, entry.targetOpacity, k);

      const isOpacityVisible = entry.opacity > 0.01 || entry.targetOpacity > 0;
      entry.label.visible = isOpacityVisible;
      if (isOpacityVisible) {
        entry.label.fillOpacity = entry.opacity;
        entry.label.outlineOpacity = entry.opacity;
      }

      if (isTargetNear(entry.opacity, entry.targetOpacity)) {
        entry.opacity = entry.targetOpacity;
        this._opacityBuffer.splice(i, 1);
      }
    }
  }

  public updateColor(delta: number): void {
    const deltaSec = delta / 60;

    for (let i = this._colorAnimatingBuffer.length - 1; i >= 0; i--) {
      const entry = this._colorAnimatingBuffer[i];
      dampColor(entry.color, entry.targetColor, 8, deltaSec);
      entry.label.color = `#${entry.color.getHexString()}`;

      if (isColorNear(entry.color, entry.targetColor)) {
        entry.color.copy(entry.targetColor);
        entry.label.color = `#${entry.color.getHexString()}`;
        this._colorAnimatingBuffer.splice(i, 1);
      }
    }
  }

  private enqueueColorAnimation(entry: LabelEntry): void {
    if (!this._colorAnimatingBuffer.includes(entry)) {
      this._colorAnimatingBuffer.push(entry);
    }
  }

  private setTargetOpacity(entry: LabelEntry, target: number): void {
    if (entry.targetOpacity === target) return;

    entry.targetOpacity = target;
    this.enqueueOpacityAnimation(entry);
  }

  private enqueueOpacityAnimation(entry: LabelEntry): void {
    if (!this._opacityBuffer.includes(entry)) {
      this._opacityBuffer.push(entry);
    }
  }

  public setFocusedIso(nextIso: string | null): void {
    if (this.focusedIso === nextIso) return;

    if (this.focusedIso) {
      const prevLabel = this.labelsByIso.get(this.focusedIso);

      if (prevLabel) {
        prevLabel.targetColor.set('#ffffff');
        this.enqueueColorAnimation(prevLabel);
      }
    }

    this.focusedIso = nextIso;

    if (nextIso) {
      const nextEntry = this.labelsByIso.get(nextIso);
      if (nextEntry) {
        nextEntry.targetColor.set('#da3429');
        this.enqueueColorAnimation(nextEntry);
      }
    }
  }

  public get object3d(): THREE.Group {
    return this.group;
  }

  public getEntryByIso(iso: string): LabelEntry | undefined {
    return this.labelsByIso.get(iso);
  }

  public updateVisibility(): void {
    this.group.visible = true;
    const zoomNormalized = this.options.getZoomNormalized();
    const minImportance = this.computeMinImportance(zoomNormalized);

    this.camera.updateMatrixWorld();
    this.proj.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.proj);

    const viewportW = this.options.container.clientWidth;
    const viewportH = this.options.container.clientHeight;

    const state: LabelsFrameState = {
      zoomNormalized,
      minImportance,
      camDir: this.camDir.copy(this.camera.position).normalize(),
      frustum: this.frustum,
      viewportW,
      viewportH,
      horizonDot: this.computeHorizonDot(),
    };

    const candidates = this._candidateBuffer;
    candidates.length = 0;

    const importanceH = this.options.importanceHysteresis ?? 0.03;
    const dotH = this.options.horizonHysteresis ?? 0.02;
    const extraFilters = this.options.filters ?? [];
    this.group.updateWorldMatrix(true, false);

    for (const entry of this.labels) {
      const wasAccepted = entry.wasAccepted;
      const passImportance = this.passWithHysteresis(
        entry.importance,
        state.minImportance,
        wasAccepted,
        importanceH
      );
      if (!passImportance) continue;
      if (this.hiddenByPins.has(entry.iso)) continue;

      const dot = entry.normal.dot(state.camDir);
      const passDot = this.passWithHysteresis(dot, state.horizonDot, wasAccepted, dotH);
      if (!passDot) continue;

      const worldPos = this.worldPos
        .copy(entry.label.position)
        .applyMatrix4(this.group.matrixWorld);
      if (!this.frustum.containsPoint(worldPos)) continue;

      entry.label.quaternion.copy(this.camera.quaternion);
      entry.label.updateWorldMatrix(false, false);

      const passOther = extraFilters.every((f) => f(entry, state));
      if (passOther) {
        candidates.push(entry);
      }
    }

    const accepted = this.selectStableVisible(
      candidates,
      viewportW,
      viewportH,
      this.options.maxVisible ?? Number.POSITIVE_INFINITY
    );
    const limit = accepted.length;

    const canShow = this.options.canInteract ? this.options.canInteract() : true;

    for (const entry of this.labels) {
      entry.wasAccepted = false;
      this.setTargetOpacity(entry, 0);
    }

    for (let i = 0; i < limit; i++) {
      accepted[i].wasAccepted = true;
      this.setTargetOpacity(accepted[i], canShow ? 1 : 0);
    }
  }

  public dispose(): void {
    for (const entry of this.labels) {
      this.group.remove(entry.label);
      entry.label.dispose();
    }
    this.labels = [];
    this.group.parent?.remove(this.group);
    this._candidateBuffer.length = 0;
  }
}
