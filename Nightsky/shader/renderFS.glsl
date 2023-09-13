precision mediump float;
varying vec3 normalTrans;
varying vec3 vertPos;       // Vertex position
uniform float kAmb;   		// Ambient reflection coefficient
uniform float kDif;   		// Diffuse reflection coefficient
uniform float kSpe;  		// Specular reflection coefficient
uniform float shininess; 	// Shininess
// Material color
uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform vec3 lightPos;
uniform vec3 viewPos;
uniform samplerCube lightShadowMap;
uniform vec2 shadowClipNearFar;
uniform float bias;
uniform int mode;

void main() {
	if (mode == 0) {
		gl_FragColor = vec4(ambientColor, 1.0);
	} else {
		vec3 N = normalize(normalTrans);
		vec3 L = normalize(lightPos - vertPos);
		// Lambert's cosine law
		float lambertian = max(dot(N, L), 0.0);
		float specular = 0.0;
		if(lambertian > 0.0) {
			vec3 R = reflect(-L, N);      // Reflected light vector
			vec3 V = normalize(viewPos - vertPos); // Vector to viewer
			// Compute the specular term
			float specAngle = max(dot(R, V), 0.0);
			specular = pow(specAngle, shininess);
		}
		float depth = 10e5 * (length(vertPos - lightPos) - shadowClipNearFar.x) / (shadowClipNearFar.y - shadowClipNearFar.x);
		float shadowMapValue = textureCube(lightShadowMap, -L).r;
		if ((shadowMapValue + bias) >= depth) {
			gl_FragColor = vec4(kAmb * ambientColor +
                      kDif * lambertian * diffuseColor +
                      kSpe * specular * specularColor, 1.0);
		} else {
			gl_FragColor = vec4(kAmb * ambientColor,1.0);
		}
	}
}