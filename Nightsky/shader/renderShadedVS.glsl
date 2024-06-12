/* Vertex shader for the program to render shaded. */

// Medium precision for floats.
precision mediump float;

/* Attributes */
attribute vec3 position; // Vertex position in object space.
attribute vec3 normal;   // Vertex normal in object space.
attribute vec2 texCoord; // Texture coordinates.

/* Uniforms */
uniform mat4 mWorld;    // World matrix.
uniform mat4 mView;     // View matrix.
uniform mat4 mProj;     // Projection matrix.
uniform mat4 mNormal;   // World matrix for normals.

/* Varyings */
varying vec3 vertNormal;    // Transformed vertex normal.
varying vec2 vertTexCoord;  // Vertex texture coordinates.
varying vec3 vertCoord;     // Transformed vertex position in world space.

/* main function */
void main() {
    // Transform vertex position and normal.
    vec4 vertCoord4 = mWorld * vec4(position, 1.0);
    vertCoord = vec3(vertCoord4) / vertCoord4.w;
    // Pass the transformed normal to the fragment shader.
    vertNormal = vec3(mNormal * vec4(normal, 0.0));
    // Pass the texture coordinates to the fragment shader.
    vertTexCoord = texCoord;
    // Fully transform and set the vertex position.
    gl_Position = mProj * mView * vertCoord4;
}