precision mediump float;

varying vec3 v_color;

void main() {
    gl_FragColor = vec4(abs(v_color), 1.0);
    //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}