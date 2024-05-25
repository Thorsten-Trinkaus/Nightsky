precision mediump float;

varying vec2 vertTexCoord;

uniform int enableTexture;
uniform sampler2D texture;
uniform vec3 color;
uniform float brightness;

void main() { 
    if (enableTexture == 1) {
        vec4 texColor = texture2D(texture, vertTexCoord);
        gl_FragColor = 0.5*texColor + 0.5*vec4(color, brightness);
    } else {
        gl_FragColor = vec4(color, brightness);
    }
}