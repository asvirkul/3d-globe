import * as THREE from 'three';
import type { PinEntry, PinPlacement } from './types';
import type { PinsLayoutState, PinsLayoutContext } from './types';

export function resolvePinPlacement(
  entry: PinEntry,
  state: PinsLayoutState,
  context: PinsLayoutContext
): PinPlacement | null {
  const labelRect = context.getLabelRect(entry.iso);
  if (!labelRect) return null;

  const viewportW = state.viewportW;
  const viewportH = state.viewportH;

  const gapY = -(5 + context.pinScreenSize * 0.5);
  const gapX = 0;

  const x = labelRect.x + labelRect.w * 0.5;
  const y = labelRect.y + gapY;

  const fitsViewport =
    x - context.pinScreenSize * 0.5 >= 0 &&
    x + context.pinScreenSize * 0.5 <= viewportW &&
    y - context.pinScreenSize * 0.5 >= 0 &&
    y + context.pinScreenSize * 0.5 <= viewportH;

  if (!fitsViewport) return null;

  const worldAnchor = context.pinsScratch.worldAnchor
    .copy(entry.anchor)
    .applyMatrix4(context.group.matrixWorld);

  const rawDistance = context.camera.position.distanceTo(worldAnchor);
  const baseDistance = context.radius;
  const distance = THREE.MathUtils.lerp(baseDistance, rawDistance, 0.35);

  const worldHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(context.camera.fov * 0.5));
  const worldWidth = worldHeight * context.camera.aspect;

  const worldUnitsPerPixelX = worldWidth / viewportW;
  const worldUnitsPerPixelY = worldHeight / viewportH;

  const worldPos = context.pinsScratch.worldPosition
    .copy(worldAnchor)
    .addScaledVector(state.cameraRight, gapX * worldUnitsPerPixelX)
    .addScaledVector(state.cameraUp, -gapY * worldUnitsPerPixelY);

  const localPos = context.pinsScratch.localPosition.copy(worldPos);
  context.group.worldToLocal(localPos);

  const pinRect = {
    x: x - context.pinScreenSize / 2,
    y: y - context.pinScreenSize / 2,
    w: context.pinScreenSize,
    h: context.pinScreenSize,
  };

  return {
    position: localPos.clone(),
    pinRect,
  };
}
