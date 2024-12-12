/* Fragment shader for the selection program. */

// Medium precision for floats.
precision mediump float;

/* Uniforms */
uniform vec4 id; // Id value to be set as the fragmentcolor.

/* main function */
void main() {
	// Set the fragmentcolor.
	gl_FragColor = id;
}