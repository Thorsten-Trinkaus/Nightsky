precision mediump float;
attribute vec3 position;
attribute vec3 normal;
uniform mat4 mProj;
uniform mat4 mView;
uniform mat4 mWorld;
uniform mat4 mNormal;
varying vec3 normalTrans;
varying vec3 vertPos;

void main() {
	vec4 vertPos4 = mWorld * vec4(position, 1.0);
	vertPos = vec3(vertPos4) / vertPos4.w;
	normalTrans = vec3(mNormal * vec4(normal, 0.0));
	gl_Position = mProj * mView * vertPos4;
}