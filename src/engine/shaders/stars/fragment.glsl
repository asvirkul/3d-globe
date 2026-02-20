varying float vIntensity;
varying vec3 vColor;

void main() {

  float dist = length(gl_PointCoord - vec2(0.5));

  float glow = exp(-dist * 3.0);
  float core = exp(-dist * 20.0);

  float intensity = vIntensity * (glow + core * 2.0);

  gl_FragColor = vec4(vColor * intensity, glow);
}