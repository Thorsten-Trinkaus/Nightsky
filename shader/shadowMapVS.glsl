/* Vertex shader for the program to generate the shadow cube map. */

// Medium precision for floats.
precision mediump float;

/* Attribute */
attribute vec3 position; // Vertex position in object space.

/* Uniforms */
uniform mat4 mProj;	 // Projection matrix.
uniform mat4 mView;	 // View matrix.
uniform mat4 mWorld; // World matrix.

/* Varying */
varying vec3 vertPos; // Transformed vertex position in world space.

/* main function */
void main() {
	// Transform the vertex position and pass it to the fragment shader.
	vertPos = (mWorld * vec4(position, 1.0)).xyz;
	// Fully transform and set the vertex position.
	gl_Position = mProj * mView * vec4(vertPos, 1.0);
}