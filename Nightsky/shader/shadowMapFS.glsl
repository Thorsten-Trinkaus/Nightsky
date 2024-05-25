precision mediump float;
varying vec3 fragPos;
uniform vec3 lightPos;
uniform vec2 shadowClipNearFar;

void main() {
	vec3 distV = (fragPos - lightPos);
	float depth = (length(distV) - shadowClipNearFar.x) / (shadowClipNearFar.y - shadowClipNearFar.x);
	gl_FragColor = vec4(depth, depth, depth, 1.0);
}