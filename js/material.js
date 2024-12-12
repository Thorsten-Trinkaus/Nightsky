/**
 * A class to represent materials needed for rendering with phong shading.
 * A Material consists of ambient, diffuse and specular reflection coefficients
 * and phong exponent.
 */
class Material {
    /**
     * @constructor
     * @param {!Number} kAmb - ambient reflection coefficient between 0 and 1
     * @param {!Number} kDif - diffuse reflection coefficient between 0 and 1
     * @param {!Number} kSpe - specular reflection coefficient between 0 and 1
     * @param {!Number} shininess - phong exponent
     */
    constructor(kAmb, kDif, kSpe, shininess) {
        this.kAmb = kAmb;
        this.kDif = kDif;
        this.kSpe = kSpe;
        this.shininess = shininess;
    }
}

/**
 * @global
 * Two basic materials. This is a global constant, so it can be used easily 
 * from outside this file. amb only uses ambient colors, while all uses all
 * three coefficients.
 */
const basicMaterials = {
    amb:    new Material(1,0,0,0),
    all:    new Material(.1,1,.2,40)
};