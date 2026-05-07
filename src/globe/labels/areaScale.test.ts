import { buildAreaScale, getLabelSizePx, resolveImportance } from './areaScale';
import type { AreaScale } from './types';
import { describe, expect, it } from 'vitest';

describe('buildAreaScale', () => {
  it('minPx and maxPx are constants', () => {
    const scale = buildAreaScale([10, 100, 1000, 10000]);
    expect(scale.minPx).toBe(5);
    expect(scale.maxPx).toBe(10);
  });

  it('minArea is never less than 1', () => {
    const scale = buildAreaScale([0.1, 0.2, 0.3]);
    expect(scale.minArea).toBeGreaterThanOrEqual(1);
  });

  it('maxArea is always greater than minArea', () => {
    const scale = buildAreaScale([10, 100, 1000, 10000]);
    expect(scale.maxArea).toBeGreaterThan(scale.minArea);
  });

  it('identical values produce maxArea = minArea + 1', () => {
    const scale = buildAreaScale([500, 500, 500, 500]);
    expect(scale.maxArea).toBe(scale.minArea + 1);
  });
});

describe('getLabelSizePx', () => {
  const scale: AreaScale = { minArea: 1, maxArea: 100, minPx: 5, maxPx: 10 }; 
    it('returns minPx when area <= minArea', () => {
    expect(getLabelSizePx(1, scale)).toBe(5);
  });

  it('returns maxPx when area >= maxArea', () => {
    expect(getLabelSizePx(100, scale)).toBe(10);
  });
});

describe('resolveImportance', () => {
  it('uses override when provided', () => {
    const scale: AreaScale = { minArea: 10, maxArea: 1000, minPx: 5, maxPx: 10 };

    expect(resolveImportance(100, scale, 0.6)).toBe(0.6);
  });

  it('clamps override belongs to the interval [0, 1]', () => {
    const scale = { minArea: 10, maxArea: 1000, minPx: 5, maxPx: 10 };

    expect(resolveImportance(100, scale, -1)).toBe(0);
    expect(resolveImportance(100, scale, 2)).toBe(1);
  });
});