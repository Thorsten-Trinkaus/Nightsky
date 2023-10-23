precision mediump float;
attribute vec3 vertPos;
uniform mat4 mProj;
uniform mat4 mView;
uniform mat4 mWorld;

void main() {
	gl_Position = mProj * mView * mWorld * vec4(vertPos, 1.0);
}