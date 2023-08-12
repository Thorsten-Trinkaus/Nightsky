const {vec2, vec3, vec4, mat3, mat4} = glMatrix;

function init() {
    loadTextResource('./shader/vs.glsl', function (vsErr, vsText) {
        if (vsErr) {
            alert('ERROR: getting vertex shader');
            console.error(vsErr);
        } else {
            loadTextResource('./shader/fs.glsl', function (fsErr, fsText) {
                if (fsErr) {
                    alert('ERROR: getting fragment shader');
                    console.error(fsErr);
                } else {
                    //calling main
                    main(vsText, fsText);
                }
            });
        }
    });
}

function main(vsText, fsText) {
    //getting the html-elements for the canvas and the fps counter
    var canvas = document.getElementById('canvas');

    /** @type {WebGLRenderingContext} */
    var gl = canvas.getContext('webgl');

    if (!gl) {
        alert('webgl not supported \n trying experimental');
        gl = canvas.getContext('experimental-webgl');
    }
    if (!gl) {
        alert('the browser does not even support experimental-webgl');
    }

    //resize canvas and viewport to the current browser-window-size
    onResize();

    //enabling depth-testing and backface-culling
    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.CULL_FACE);
    //gl.frontFace(gl.CCW);
    //gl.cullFace(gl.BACK);

    //load shaders


    //create Shaders
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    //setting the shader source code
    gl.shaderSource(vertexShader, vsText);
    gl.shaderSource(fragmentShader, fsText);

    let program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    // Create Sphere
    var sphere = new Sphere(gl, Array(0, 0, 0), Array(0, 0, 0), 1, 1, 16, 32);

    // Get Attribute Locations
    var positionLocation = gl.getAttribLocation(program, "a_position");

    // Get Uniform Locations
    var projMatLocation = gl.getUniformLocation(program, "u_projMat");
    var viewMatLocation = gl.getUniformLocation(program, "u_viewMat");
    var worldMatLocation = gl.getUniformLocation(program, "u_worldMat");

    // Create Buffers
    var positionBuffer = gl.createBuffer();
    var indexBuffer = gl.createBuffer();

    // Bind Buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // Buffer Data
    var data = sphere.getArrayBufferContent();
    console.log(data.length)

    gl.bufferData(
        gl.ARRAY_BUFFER,
        data,
        gl.STATIC_DRAW
    );

    let array = Array();

    Array(data.length-1).fill(1).map((n, i) => n + i - 1).forEach((item) => {array.push(item, item+1)})

    console.log(array)

    var indices = new Uint16Array(array);

    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        indices,
        gl.STATIC_DRAW
    );

    // Define Access
    gl.vertexAttribPointer(
        positionLocation,
        3,                  // number of coordinates per vertex
        gl.FLOAT,
        false,
        0,
        0
    );

    // Boilerplate
    gl.enableVertexAttribArray(positionLocation);

    // Define Camera
    var cam = new Camera(
        canvas,
        vec3.fromValues(5, 5, 0),
        vec3.fromValues(0, 0, 0),
        vec3.fromValues(0, 1, 0)
    );

    cam.update(0.0);

    // Define Matrices
    var worldMatrix = mat4.create();
    var viewMatrix = mat4.create();
    var projMatrix = mat4.create();

    mat4.identity(worldMatrix);
    viewMatrix = cam.getViewMat();
    mat4.perspective(projMatrix, glMatrix.glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);

    // Set the Uniforms
    gl.uniformMatrix4fv(worldMatLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(viewMatLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(projMatLocation, gl.FALSE, projMatrix);

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /*gl.drawArrays(
        gl.TRIANGLES,
        0,
        3
    );*/

    gl.drawElements(
        gl.LINES,
        indices.length / 3,         // number of vertices
        gl.UNSIGNED_SHORT,
        0
    )


    //frametimes
    var dt = 0;
    var prevFrameTime = 0;
    var currFrameTime = 0;


    requestAnimationFrame(draw);
    //draw-func
    function draw() {

        //calculate delta-time and setting prev-/currFrameTime for the next draw-call
        currFrameTime = performance.now();
        dt = currFrameTime - prevFrameTime;
        prevFrameTime = currFrameTime;

        //updating the camera-position and camera-rotation
        cam.update(dt);
        //updating the mats
        //mat4.rotate(worldMatrix, iMat, currFrameTime / 1000 / 6 * 2 * Math.PI, [1,1,0.5]); //gets rotated around x axis
        viewMatrix = cam.getViewMat();
        mat4.perspective(projMatrix, glMatrix.glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);

        // Set the Uniforms
        gl.uniformMatrix4fv(worldMatLocation, gl.FALSE, worldMatrix);
        gl.uniformMatrix4fv(viewMatLocation, gl.FALSE, viewMatrix);
        gl.uniformMatrix4fv(projMatLocation, gl.FALSE, projMatrix);

        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        /*gl.drawArrays(
            gl.TRIANGLES,
            0,
            3
        );*/

        gl.drawElements(
            gl.LINES,
            indices.length / 3,         // number of vertices
            gl.UNSIGNED_SHORT,
            0
        )

        //next draw-func call
        requestAnimationFrame(draw);
    }




    //gets triggered by onResize-Listener and resizes the canvas to the current browser-window-size
    function onResize() {
        //resize canvas and viewport to the current browser-window-size
        canvas.width = window.innerWidth - 40;
        canvas.height = window.innerHeight - 40;
        gl.viewport(0,0,canvas.width,canvas.height);
    }
}

