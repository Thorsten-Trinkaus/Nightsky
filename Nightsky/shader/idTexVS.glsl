/* Vertex shader for the selection program. */

// Medium precision for floats.
precision mediump float;

/* Attributes */
attribute vec3 position; // Vertex position in object space.

/* Uniforms */
uniform mat4 mProj;	 // Projection matrix.
uniform mat4 mView;	 // View matrix.
uniform mat4 mWorld; // World matrix.

/* main function */
void main() {
	// Transform and set the vertex position.
	gl_Position = mProj * mView * mWorld * vec4(position, 1.0);
}