/* Fragment shader for the program to generate the shadow cube map. */

// Medium precision for floats.
precision mediump float;

/* Varying */
varying vec3 vertPos; // Vertex position in world space.

/* Uniforms */
uniform vec3 lightPos;	 // Light position
uniform vec2 shadowClip; // Clipping distances for the shadow 
						 // generation cameras.

/* main function */
void main() {
	// Compute the depth value from the light source to the vertex and
    // normalize it to a value between 0 and 1 using the cliping distances.
	vec3 distV = (vertPos - lightPos);
	float depth = (
		(length(distV) - shadowClip.x) 
		/ 
		(shadowClip.y - shadowClip.x)
	);
	// Set the value as r,g and b of the fragment color.
	gl_FragColor = vec4(depth, depth, depth, 1.0);
}