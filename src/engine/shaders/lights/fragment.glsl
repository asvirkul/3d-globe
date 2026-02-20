uniform sampler2D nightMap;
uniform float opacity;

varying vec2 vUv;

void main() {

    vec3 nightColor = texture2D(nightMap, vUv).rgb;

    float luminance = dot(nightColor, vec3(0.299, 0.587, 0.114));

    gl_FragColor = vec4(nightColor, luminance * opacity);
}
