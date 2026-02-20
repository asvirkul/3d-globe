attribute float aSize;
attribute float aIntensity;
attribute vec3 aColor;
varying vec3 vColor;

varying float vIntensity;

uniform float uPixelRatio;
uniform float uFov;
uniform float uScreenHeight;

void main() {
  vColor = aColor;
  vIntensity = aIntensity;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  float fovRad = radians(uFov);
  float perspectiveScale =
    uScreenHeight / (2.0 * tan(fovRad * 0.5));

  gl_PointSize = aSize * perspectiveScale;
  gl_PointSize /= -mvPosition.z;
  gl_PointSize *= uPixelRatio;

  gl_Position = projectionMatrix * mvPosition;
}