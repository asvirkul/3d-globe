import * as THREE from 'three';
import type { AreaScale } from './types';

export function resolveImportance(area: number, scale: AreaScale, override?: number): number {
  if (override !== undefined) {
    return THREE.MathUtils.clamp(override, 0, 1);
  }
  return getAreaImportance(area, scale);
}

function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 1;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  const t = i - lo;
  return sorted[lo] * (1 - t) + sorted[hi] * t;
}

export function buildAreaScale(areas: readonly number[]): AreaScale {
  const clean = areas.filter((a) => Number.isFinite(a) && a > 0).sort((a, b) => a - b);
  const p5 = quantile(clean, 0.05);
  const p95 = quantile(clean, 0.95);
  const scale = {
    minArea: Math.max(1, p5),
    maxArea: Math.max(p95, p5 + 1),
    minPx: 5,
    maxPx: 10,
  };

  return scale;
}

export function getLabelSizePx(area: number, s: AreaScale): number {
  const a = Math.min(Math.max(area, s.minArea), s.maxArea);
  const t = (Math.log(a) - Math.log(s.minArea)) / (Math.log(s.maxArea) - Math.log(s.minArea));
  return s.minPx + t * (s.maxPx - s.minPx);
}

export function getAreaImportance(area: number, s: AreaScale): number {
  const a = Math.min(Math.max(area, s.minArea), s.maxArea);

  const denom = Math.log(s.maxArea) - Math.log(s.minArea);
  if (denom <= Number.EPSILON) return 0.5;

  const t = (Math.log(a) - Math.log(s.minArea)) / denom;

  return Math.min(Math.max(t, 0), 1);
}
