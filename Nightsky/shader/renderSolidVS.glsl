/* Vertex shader for the program to render objects with a solid color. */

// Medium precision for floats.
precision mediump float;

/* Attributes */
attribute vec3 position; // Vertex position.
attribute vec2 texCoord; // Texture coordinates.

/* Uniforms */
uniform mat4 mWorld; // World matrix. 
uniform mat4 mView;  // View matrix.
uniform mat4 mProj;  // Projection matrix.

/* Varying */
varying vec2 vertTexCoord; // Vertex texture coordinates.

/* main function */
void main() {
    // Pass the texture coordinates to the fragment shader.
    vertTexCoord = texCoord;
    // Transform and set vertex position.
    gl_Position = mProj * mView * mWorld * vec4(position, 1.0);
}