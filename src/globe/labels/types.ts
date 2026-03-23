import type * as THREE from 'three';
import type { Text as TroikaText } from 'troika-three-text';

export type AreaScale = {
  minArea: number;
  maxArea: number;
  minPx: number;
  maxPx: number;
};

export type BlockBounds = [number, number, number, number];

export type TroikaTextRenderInfo = TroikaText & {
  fillOpacity: number;
  outlineOpacity: number;
  strokeOpacity: number;
  textRenderInfo?: {
    blockBounds?: BlockBounds;
  };
};

export type ScreenRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type LabelEntry = {
  iso: string;
  label: TroikaTextRenderInfo;
  normal: THREE.Vector3;
  importance: number;
  wasAccepted: boolean;
  opacity: number;
  targetOpacity: number;
  color: THREE.Color;
  targetColor: THREE.Color;
};

export type LabelsFrameState = {
  zoomNormalized: number;
  minImportance: number;
  camDir: THREE.Vector3;
  frustum: THREE.Frustum;
  viewportW: number;
  viewportH: number;
  horizonDot: number;
};

export type LabelFilter = (entry: LabelEntry, state: LabelsFrameState) => boolean;
