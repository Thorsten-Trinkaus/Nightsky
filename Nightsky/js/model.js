{
    /**
     * A class to represent models for rendering.
     * A Model-object consists of a list of vertex attributes and a WebGL 
     * buffer with the vertex attributes as Buffer content.
     */
    class Model {
        /**
         * @constructor
         * @param {!number[]} vertices - list of vertex 
         *      coordinates (number, number, number), 
         *      texture-coordinates (number number) and 
         *      normals (number, number, number)
         */
        constructor(vertices) {
            // getGlContext() is defined in render.js.
            /** @type {WebGLRenderingContext} */
            const gl = getGLContext();
            this.vertices = vertices;
            // Create a buffer for vertex attributes, bind it and fill
            // it with the vertex data.
            this.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(
                gl.ARRAY_BUFFER, 
                this.vertices, 
                gl.STATIC_DRAW      // Specified once | 
                                    // used many times by WebGL.
            );
            // Unbind buffer.
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
    }

    // Map of models (key: name, value: Model-object). This map is not global, 
    // but can be accessed from the outside by the function getModel(). To add 
    // a model to the map either use addModel() or addModelFromPath().
    const models = new Map();
    // Add a model with no vertices. This model should be returned by 
    // getModel(), if there is no model that matches the parameter of 
    // getModel().
    models.set("empty", []);

    /**
     * Getter function for the models map.
     * @param {!string} name - the name of the model that should be returned
     * @returns {!Model} the function returns the Model-object with the 
     *      specified name | if there is no model with this name, the function 
     *      returns the basic model without vertices
     */
    function getModel(name) {
        // Return the model with no vertices, if there is no model with 
        // this name.
        if (models.get(name) === undefined) {
            return models.get("empty");
        }
        // Else, return the needed model.
        return models.get(name);
    }

    /**
     * Setter function of the models map.
     * @param {!string} name - name for the new model
     * @param {!Model} model - the Model-object to be added
     */
    function addModel(name, model) {
        // If there is no model with the given name, add the new model.
        // Else, the model already exists. This case gets logged to 
        // the console.
        if (models.get(name) === undefined) {
            models.set(name, model);
        } else {
            console.log("Model " + name + " already exists!");
        }
    }

    /**
     * Setter function of the models map. This function uses a path to create a
     * new Model-object, which then gets added to the models map. Note that 
     * the model data for the path needs to be loaded before calling this 
     * function. See load.js for more information on how to load data from 
     * files.
     * @param {!string} name - name for the new model
     * @param {!string} path - path of the needed model data
     */
    function addModelFromPath(name, path) {
        // Get the raw data from the path, needed for adding the new 
        // Model-object. The function getDataMap() is defined in load.js.
        let data = getDataMap(path);
        // If there is no data for the given path, the function logs this to 
        // the console. Else, try to create a new Model-object and add it to 
        // the models map.
        if (data === undefined) {
            console.log(path + " does not exist!")
        } else {
            // parse the raw data, so it can be used for a new Model-object.
            // The function parseModelData() is defined in load.js.
            data = parseModelData(data);
            // If there is no model with the specified name yet, create a new 
            // Model-object with the data and add it to the map. Else, the 
            // model already exists. This case gets logged to the console.
            if (models.get(name) === undefined) {
                models.set(name, new Model(data));
            } else {
                console.log("Model " + name + " already exists!");
            }
        }
    }
}