//Hashmap (key = filename, value = modeldata) (modelData only gets loaded once)
var modelDataMap = new Map();
function setModelDataMap(key, value) {
    modelDataMap.set(key, value);
}

class Model {
    constructor(
        gl, model, 
        ambColor, difColor, speColor, 
        kAmb, kDif, kSpe, shininess
    ) {
        this.gl = gl;
        this.vertices = modelDataMap.get(model);
        this.ambColor = ambColor;
        this.difColor = difColor;
        this.speColor = speColor;
        this.kAmb = kAmb;
        this.kDif = kDif;
        this.kSpe = kSpe;
        this.shininess = shininess;
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER, 
            new Float32Array(this.vertices), 
            gl.STATIC_DRAW
        );
    }
}

class Sphere extends Model {
    constructor(
        gl, 
        ambColor, difColor, speColor, 
        kAmb, kDif, kSpe, shininess
    ) {
        super(
            gl, 'sphere.obj', 
            ambColor, difColor, speColor, 
            kAmb, kDif, kSpe, shininess
        );
    }
}

class Circle extends Model {
    constructor(
        gl, 
        ambColor, difColor, speColor, 
        kAmb, kDif, kSpe, shininess
    ) {
        super(
            gl, 'circle.obj', 
            ambColor, difColor, speColor, 
            kAmb, kDif, kSpe, shininess
        );
    }
}