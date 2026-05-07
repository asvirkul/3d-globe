import { describe, expect, it } from 'vitest';
import { pointInPolygon, pointInBBox } from './pointInPolygon';
import type { PolygonCoordinates } from './types';

describe('pointInPolygon', () => {
  it('returns true when point is inside', () => {
    const square: PolygonCoordinates = [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
    ];

    expect(pointInPolygon(5, 5, square)).toBe(true);
  });

  it('returns false when point is outside', () => {
    const square: PolygonCoordinates = [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
    ];

    expect(pointInPolygon(15, 5, square)).toBe(false);
  });

  it('returns false when the point is inside a hole', () => {
    const squareWithHole: PolygonCoordinates = [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
      [
        [5, 5],
        [7, 5],
        [7, 7],
        [5, 7],
        [5, 5],
      ],
    ];
    expect(pointInPolygon(6, 6, squareWithHole)).toBe(false);
  });
});

describe('pointInBBox', () => {
  it('returns true when lon >= minLon', () => {
    expect(pointInBBox(0, 179, [170, -10, -170, 10])).toBe(true);
  });

  it('returns false when the poin is out of maxLon/maxLat range', () => {
    expect(pointInBBox(0, 0, [170, -10, -170, 10])).toBe(false);
  });
});
