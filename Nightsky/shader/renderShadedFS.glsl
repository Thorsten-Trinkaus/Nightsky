precision mediump float;

varying vec3 vertNormal;
varying vec2 vertTexCoord;
varying vec3 vertCoord;

uniform int enableTexture;
uniform sampler2D texture;
uniform float kAmb;
uniform float kDif;
uniform float kSpe;
uniform float shininess;
uniform vec3 ambColor;
uniform vec3 difColor;
uniform vec3 speColor;
uniform float brightness;
uniform vec3 lightPosition;
uniform vec3 camPosition;
uniform samplerCube lightShadowMap;
uniform vec2 shadowClip;
uniform float bias;

void main() { 
    vec3 N = normalize(vertNormal);
    vec3 L = normalize(lightPosition - vertCoord);
    float lambertian = max(dot(N, L), 0.0);
    float specular = 0.0;
    if (lambertian > 0.0) {
        vec3 R = reflect(-L, N);
        vec3 V = normalize(camPosition - vertCoord);
        float specAngle = max(dot(R, V), 0.0);
        specular = pow(specAngle, shininess);
    }
    float depth =  
        (length(vertCoord - lightPosition) - shadowClip.x) / 
        (shadowClip.y - shadowClip.x);
    float shadowMapValue = textureCube(lightShadowMap, -L).r;
    if ((shadowMapValue + bias) >= depth) {
        if (enableTexture == 1) {
            vec4 texColor = texture2D(texture, vertTexCoord);
            gl_FragColor = 0.5*texColor + 0.5*(
                vec4(kAmb * ambColor +
                kDif * lambertian * difColor +
                kSpe * specular * speColor, brightness));
        } else {
            gl_FragColor = vec4(kAmb * ambColor +
                kDif * lambertian * difColor +
                kSpe * specular * speColor, brightness);
        }
    } else {
        if (enableTexture == 1) {
            vec4 texColor = texture2D(texture, vertTexCoord);
            gl_FragColor = 0.5*texColor + 0.5*vec4(kAmb * ambColor, brightness);
        } else {
            gl_FragColor = vec4(kAmb * ambColor, brightness);
        }
    }
}