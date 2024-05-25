precision mediump float;

attribute vec3 position;
attribute vec2 texCoord;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

varying vec2 vertTexCoord;

void main() {
    vec4 vertCoord4 = mWorld * vec4(position, 1.0);
    vertTexCoord = texCoord;
    gl_Position = mProj * mView * vertCoord4;
}