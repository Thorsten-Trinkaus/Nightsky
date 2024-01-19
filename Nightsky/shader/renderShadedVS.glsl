precision mediump float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;
uniform mat4 mNormal;

varying vec3 vertNormal;
varying vec2 vertTexCoord;
varying vec3 vertCoord;

void main() {
    vec4 vertCoord4 = mWorld * vec4(position, 1.0);
    vertCoord = vec3(vertCoord4) / vertCoord4.w;
    vertNormal = vec3(mNormal * vec4(normal, 0.0));
    vertTexCoord = texCoord;
    gl_Position = mProj * mView * vertCoord4;
}