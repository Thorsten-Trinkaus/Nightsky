{
    class Model {
        constructor(vertices) {
            let gl = getGLContext();
            this.vertices = vertices;
            this.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(
                gl.ARRAY_BUFFER, 
                this.vertices, 
                gl.STATIC_DRAW
            );
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
    }

    const models = new Map();

    function getModel(name) {
        return models.get(name);
    }

    function addModel(name, model) {
        if (models.get(name) === undefined) {
            models.set(name, model);
        } else {
            console.log("Model " + name + " already exists!");
        }
    }

    function addModelFromPath(name, path) {
        let data = getDataMap(path);
        if (data === undefined) {
            console.log(path + " does not exist!")
        } else {
            data = parseModelData(data);
            if (models.get(name) === undefined) {
                models.set(name, new Model(data));
            } else {
                console.log("Model " + name + " already exists!");
            }
        }
    }
}