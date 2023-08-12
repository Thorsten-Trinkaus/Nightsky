attribute vec3 a_position;

uniform mat4 u_projMat;
uniform mat4 u_viewMat;
uniform mat4 u_worldMat;

varying vec3 v_color;

 void main() {
     v_color = a_position.xyz;
     gl_Position = u_projMat * u_viewMat * u_worldMat * vec4(a_position, 1.0);
 }