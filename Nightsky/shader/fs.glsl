precision mediump float;
varying vec3 normalTrans;
varying vec3 vertPos;       // Vertex position
uniform float kAmb;   // Ambient reflection coefficient
uniform float kDif;   // Diffuse reflection coefficient
uniform float kSpe;   // Specular reflection coefficient
uniform float shininess; // Shininess
// Material color
uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
const vec3 lightPos = vec3(1000,0,1000);

void main() {
  vec3 N = normalize(normalTrans);
  vec3 L = normalize(lightPos - vertPos);

  // Lambert's cosine law
  float lambertian = max(dot(N, L), 0.0);
  float specular = 0.0;
  if(lambertian > 0.0) {
    vec3 R = reflect(-L, N);      // Reflected light vector
    vec3 V = normalize(-vertPos); // Vector to viewer
    // Compute the specular term
    float specAngle = max(dot(R, V), 0.0);
    specular = pow(specAngle, shininess);
  }
  gl_FragColor = vec4(kAmb * ambientColor +
                      kDif * lambertian * diffuseColor +
                      kSpe * specular * specularColor, 1.0);
}
