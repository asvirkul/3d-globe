import * as THREE from 'three';
import { Text } from 'troika-three-text';

export function createCountryText(name: string, fontPx: number): Text {
  const text = new Text();

  text.text = name;
  text.font = '/assets/fonts/NotoSans-Regular.ttf';
  text.fontSize = fontPx * 0.3;

  text.frustumCulled = false;
  text.renderOrder = 10;

  text.color = '#f5f5f5';
  text.anchorX = 'center';
  text.anchorY = 'middle';
  text.textAlign = 'center';

  text.whiteSpace = 'normal';
  text.overflowWrap = 'break-word';
  text.lineHeight = 1.05;
  text.outlineColor = '#000000';
  text.outlineOpacity = 0.4;
  text.outlineWidth = 0.2;
  text.outlineBlur = 0;

  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    opacity: 1,
  });

  text.material = material;

  text.sync();

  return text;
}
