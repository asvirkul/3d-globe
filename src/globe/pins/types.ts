import * as THREE from 'three';

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

export type PinPlacement = {
  visible: boolean;
  position: THREE.Vector3;
};

export type ScreenRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};
