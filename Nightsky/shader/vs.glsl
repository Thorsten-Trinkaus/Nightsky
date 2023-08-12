attribute vec3 position;
attribute vec3 normal;
uniform mat4 mProj, mView, mWorld, mNormal;
varying vec3 normalTrans;
varying vec3 vertPos;

void main(){
  vec4 vertPos4 = mView * mWorld * vec4(position, 1.0);
  vertPos = vec3(vertPos4) / vertPos4.w;
  normalTrans = vec3(mNormal * vec4(normal, 0.0));
  gl_Position = mProj * vertPos4;
}