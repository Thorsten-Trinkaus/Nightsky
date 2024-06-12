/* Fragment shader for the program to render objects with a solid color. */

// Medium precision for floats.
precision mediump float;

/* Varying */
varying vec2 vertTexCoord; // Texture coordinates.

/* Uniforms */
uniform int enableTexture; // Should a texture be used? 
uniform sampler2D texture; // The texture, if needed.
uniform vec3 color;        // The color.
uniform float alpha;       // Alpha value for the color.

/* main function */
void main() { 
    // If a texture should be used, set the fragment color, using both 
    // the texture color and the given color. Else, only use the given color.
    if (enableTexture == 1) {
        // Get the texture color at the given coordinates.
        vec4 texColor = texture2D(texture, vertTexCoord);
        gl_FragColor = 0.5*texColor + 0.5*vec4(color, alpha);
    } else {
        gl_FragColor = vec4(color, alpha);
    }
}