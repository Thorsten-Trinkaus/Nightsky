//Hashmap (key = filename, value = modeldata) (modelData only gets loaded once)
var modelDataMap = new Map();
function setModelDataMap(key, value) {
    modelDataMap.set(key, value);
}

class Model {
    constructor(gl, model) {
        this.gl = gl;
        this.vertices = modelDataMap.get(model);
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER, 
            new Float32Array(this.vertices), 
            gl.STATIC_DRAW
        );
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}