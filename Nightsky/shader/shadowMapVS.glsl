precision mediump float;
attribute vec3 vertPos;
uniform mat4 mProj;
uniform mat4 mView;
uniform mat4 mWorld;
varying vec3 fragPos;

void main() {
	fragPos = (mWorld * vec4(vertPos, 1.0)).xyz;
	gl_Position = mProj * mView * vec4(fragPos, 1.0);
}