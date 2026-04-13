import * as THREE from 'three';
import type { VisibleLabelRect } from '../labels/types';

export type CountryPinMeta = {
  companyCount: number;
};

export type CountryPinResponse = {
  countries: Record<string, CountryPinMeta>;
};

export type CountryPinData = Record<string, CountryPinMeta>;

export type PinEntry = {
  iso: string;
  meta: CountryPinMeta;
  anchor: THREE.Vector3;
  object: THREE.Sprite;
  visible: boolean;
  targetOpacity: number;
  opacity: number;
  hasPlacement: boolean;
};

export type PinsLayoutState = {
  viewportW: number;
  viewportH: number;
  cameraRight: THREE.Vector3;
  cameraUp: THREE.Vector3;
  visibleLabelRects: readonly VisibleLabelRect[];
  visibleRectsByIso: ReadonlyMap<string, ScreenRect>;
};

export type PinsLayoutContext = {
  camera: THREE.PerspectiveCamera;
  group: THREE.Group;
  radius: number;
  pinScreenSize: number;
  getLabelRect: (iso: string) => ScreenRect | null;
  pinsScratch: PinsLayoutScratch;
};

export type PinsLayoutScratch = {
  worldAnchor: THREE.Vector3;
  worldPosition: THREE.Vector3;
  localPosition: THREE.Vector3;
};

export type PinPlacement = {
  position: THREE.Vector3;
  pinRect: ScreenRect;
};

export type ScreenRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};
