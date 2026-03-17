declare module 'troika-three-text' {
  import { Mesh, Material } from 'three';

  export class Text extends Mesh {
    text: string;
    font?: string;
    fontSize: number;
    color: string | number;

    whiteSpace: string;
    overflowWrap: string;
    lineHeight: number;
    anchorX?: number | 'left' | 'center' | 'right';
    anchorY?: number | 'top' | 'middle' | 'bottom';
    textAlign?: 'left' | 'center' | 'right' | 'justify';

    outlineColor?: string | number;
    outlineWidth?: number | string;
    outlineOpacity?: number;
    outlineBlur?: number;

    material: Material | Material[];

    sync(callback?: () => void): void;
    dispose(): void;
  }
}
