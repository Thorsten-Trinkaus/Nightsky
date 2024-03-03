/**
 * materials required for rendering objects
 */
class Material {
    /**
     * @param {Number} kAmb - ambient reflection coefficient between 0 and 1
     * @param {Number} kDif - diffuse reflection coefficient between 0 and 1
     * @param {Number} kSpe - specular reflection coefficient between 0 and 1
     * @param {Number} shininess - phong exponent
     */
    constructor(kAmb, kDif, kSpe, shininess) {
        this.kAmb = kAmb;
        this.kDif = kDif;
        this.kSpe = kSpe;
        this.shininess = shininess;
    }
}

const basicMaterials = {
    amb:    new Material(1,0,0,0),
    all:    new Material(.1,1,.2,40)
};