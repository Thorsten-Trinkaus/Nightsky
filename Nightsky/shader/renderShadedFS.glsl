/* 
 * Fragment shader for the program to render shaded. 
 * This uses simple phong shading with some depth testing for shadows.
 */

// Medium precision for floats.
precision mediump float;

/* Varyings */
varying vec3 vertNormal;    // Transformed vertex normal.
varying vec2 vertTexCoord;  // Vertex texture coordinates.
varying vec3 vertCoord;     // Vertex position in world space.

/* Uniforms */
uniform int enableTexture;          // Should a texture be used?
uniform sampler2D texture;          // The texture, if needed.
uniform float kAmb;                 // Ambient reflection coefficient.
uniform float kDif;                 // Diffuse reflection coefficient.
uniform float kSpe;                 // Specular reflection coefficent.
uniform float shininess;            // Phong exponent.
uniform vec3 ambColor;              // Ambient color.
uniform vec3 difColor;              // Diffuse color.
uniform vec3 speColor;              // Specular color.
uniform float alpha;                // Alpha value for the color.
uniform vec3 lightPosition;         // Position of the light source.
uniform vec3 camPosition;           // Position of the camera.
uniform samplerCube lightShadowMap; // Cube map for shadow depth testing.
uniform vec2 shadowClip;            // Clipping distances for the shadow 
						            // generation cameras.
uniform float bias;                 // Bias for the shadow depth testing,
                                    // to remove flickering

/* main function */
void main() { 
    // Get every value needed for phong shading.

    // Normalized normal vector.
    vec3 N = normalize(vertNormal);
    // Normal vector from the vertex to the light source.
    vec3 L = normalize(lightPosition - vertCoord);
    // Lambertian reflectance. The max function makes sure it is non-negative.
    float lambertian = max(dot(N, L), 0.0);
    // Initialize the specular component to 0.
    float specular = 0.0;
    // If the Lambertian reflectance is greater than zero (the light is not 
    // coming from behind the surface), compute the specular component.
    if (lambertian > 0.0) {
        // Reflection of the light around the normal.
        vec3 R = reflect(-L, N);
        // Normal vector from the vertex to the camera.
        vec3 V = normalize(camPosition - vertCoord);
        // Non negative angle between the reflected light and the viewing 
        // direction.
        float specAngle = max(dot(R, V), 0.0);
        // Compute the specular with the angle and the shininess of the model.
        specular = pow(specAngle, shininess);
    }

    // Depth testing for shadows.

    // Compute the depth value from the light source to the vertex and
    // normalize it to a value between 0 and 1 using the cliping distances.
    float depth =  (
        (length(vertCoord - lightPosition) - shadowClip.x) 
        / 
        (shadowClip.y - shadowClip.x)
    );
    // Read the depth value in light direction from the shadow cube map.
    float shadowMapValue = textureCube(lightShadowMap, -L).r;
    // If the depth value of this vertex plus bias is greater as or equal to 
    // the depth value from the cube map, there is nothing obstructing the 
    // light on its way to the vertex. In this case compute the fragment color
    // using all the coefficents. Else, some objects casts a shadow onto the
    // vertex, so the fragment color only uses the ambient coefficent.
    // The bias is needed to counteract numerical errors, which lead to 
    // flickering.
    if ((shadowMapValue + bias) >= depth) {
        // If a texture is used, compute the fragment color from the colors of
        // both the object and the texture. Else only use the colors of the 
        // object.
        if (enableTexture == 1) {
            // Get the texture color at the given coordinates.
            vec4 texColor = texture2D(texture, vertTexCoord);
            gl_FragColor = (
                vec4((kAmb * (0.5 * texColor.rgb + 0.5 * ambColor) +
                kDif * lambertian * (0.5 * texColor.rgb + 0.5 * difColor) +
                kSpe * specular * speColor), alpha));
        } else {
            gl_FragColor = vec4(kAmb * ambColor +
                kDif * lambertian * difColor +
                kSpe * specular * speColor, alpha);
        }
    } else {
        // If a texture is used, compute the fragment color from the color 
        // of both the object and the texture. Else only use the ambient color
        // of the object.
        if (enableTexture == 1) {
            // Get the texture color at the given coordinates.
            vec4 texColor = texture2D(texture, vertTexCoord);
            gl_FragColor = vec4(kAmb * (0.5 * texColor.rgb + 0.5 * ambColor), alpha);
        } else {
            gl_FragColor = vec4(kAmb * ambColor, alpha);
        }
    }
}