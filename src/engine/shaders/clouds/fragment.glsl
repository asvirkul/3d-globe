uniform sampler2D cloudMap;
uniform float density;   
uniform float opacity;
uniform float haze;      

varying vec2 vUv;

void main() {

    vec4 tex = texture2D(cloudMap, vUv);

    float detail = tex.r;

    detail = pow(detail, 1.0 / density);

    float edgeStart = 0.25 - haze * 0.15;
    detail = smoothstep(edgeStart, 0.85, detail);

    float fade = smoothstep(0.0, 1.0, haze);

    float alpha = detail * opacity * fade;

    vec3 atmosphereColor = vec3(0.6, 0.75, 1.0);
    vec3 finalColor = mix(tex.rgb, atmosphereColor, haze * 0.2);

    gl_FragColor = vec4(finalColor, alpha);
}
