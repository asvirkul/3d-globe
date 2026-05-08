import * as THREE from 'three';
import { dampColor } from './animations';
import { describe, expect, it } from 'vitest';

describe('dampColor', () => {
  it('returns same color when the source color and target are equal', () => {
    const sourceColor = new THREE.Color('#ffffff');
    const targetColor = new THREE.Color('#ffffff');
    dampColor(sourceColor, targetColor, 8, 1);
    expect(sourceColor.r).toBe(targetColor.r);
  });

  it('changes source color channel towards target channel', () => {
    const sourceColor = new THREE.Color(0, 0, 0);
    const targetColor = new THREE.Color(1, 1, 1);
    const startColor = new THREE.Color(0, 0, 0);

    dampColor(sourceColor, targetColor, 8, 1);
    expect(Math.abs(sourceColor.r - targetColor.r)).toBeLessThan(
      Math.abs(startColor.r - targetColor.r)
    );
  });

  it('returns the same color when delta is 0', () => {
    const sourceColor = new THREE.Color(0.5, 0, 0);
    const targetColor = new THREE.Color(1, 1, 1);

    dampColor(sourceColor, targetColor, 8, 0);
    expect(sourceColor.r).toBe(0.5);
  });
});
