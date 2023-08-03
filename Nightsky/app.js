//import from gl-matrix-min.js
const { vec2, vec3, vec4, mat3, mat4 } = glMatrix;

//loading the shaders from .glsl file
var init = function () {
    loadTextResource('./shader/vs.txt', function (vsErr, vsText) {
        if (vsErr) {
            alert('ERROR: getting vertex shader');
            console.error(vsErr);
        } else {
            loadTextResource('./shader/fs.txt', function (fsErr, fsText) {
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
};

//main
var main = function (vsText, fsText) {

    //getting the html-elements for the canvas and the fps counter
    var canvas = document.getElementById('c1');

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
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    //creating webgl program
    var program = gl.createProgram();

    //create Shaders
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    //setting the shader source code
    gl.shaderSource(vertexShader, vsText);
    gl.shaderSource(fragmentShader,fsText);
    //compile the shaders
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("ERROR: compile vertex shader!", gl.getShaderInfoLog(vertexShader));
        return;
    }
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error("ERROR: compile fragment shader!", gl.getShaderInfoLog(fragmentShader));
        return;
    }

    //attach the shaders to the program
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    //link program
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
        return;
    }
    //validate program
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program!', gl.getProgramInfoLog(program));
        return;
    }

    var stars = new Stars(20000, 1000);

    //loading vertices and indicies
	var vertices = stars.vertices;
    var indices = stars.indices;

    //creating buffers
    var vertexBufferObject = gl.createBuffer();
    var indexBufferObject= gl.createBuffer();
    //bind buffers
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);
    //fill buffers
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    //getting locations of shader attributes
	var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
	var colorAttribLocation = gl.getAttribLocation(program, 'vertColor');
    //setting Attrib-Pointers
	gl.vertexAttribPointer(
		positionAttribLocation,             //attribute-location
		3,                                  //number of elements per attribute
		gl.FLOAT,                           //element-type
		gl.FALSE,                           //webgl needs this to be false to work?
		6 * Float32Array.BYTES_PER_ELEMENT, //size of 1 vertex
		0                                   //offset
	);
	gl.vertexAttribPointer(
		colorAttribLocation,                //attribute-location
		3,                                  //number of elements per attribute
		gl.FLOAT,                           //element-type
		gl.FALSE,                           //webgl needs this to be false to work?
		6 * Float32Array.BYTES_PER_ELEMENT, //size of 1 vertex
		3 * Float32Array.BYTES_PER_ELEMENT  //offset
    );
    //enable attribute-array
	gl.enableVertexAttribArray(positionAttribLocation);
	gl.enableVertexAttribArray(colorAttribLocation);
    
    //setting up webgl to use the program
    gl.useProgram(program);

    //getting location of mats
    var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
    var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
    var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');
    //basic setup of mats
    var worldMatrix = mat4.create();
    var viewMatrix = mat4.create();
    var projMatrix = mat4.create();
    //extra identity-mat for helping with transformation
    var iMat = mat4.create();
    mat4.identity(iMat);

    //setting up a camera-object (camera.js)
    var cam = new Camera(
        canvas,
        vec3.fromValues(0,0,-10),
        vec3.fromValues(0,0,0),
        vec3.fromValues(0,1,0)
    );
    
    //event-listeners
    var resizeList = onResize.bind(this);
    //adding the needed eventListener
    window.addEventListener("resize", resizeList);

    //frametimes
    var dt = 0;
    var prevFrameTime = 0;
    var currFrameTime = 0;

    var rgb = [29/255,53/255,87/255];
    //call the draw-func
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
        cam.getViewMat(viewMatrix);
        mat4.perspective(projMatrix, glMatrix.glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);
        //putting the mats at their location
        gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
        gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
        
        //clear with given clearColor
        gl.clearColor(rgb[0], rgb[1], rgb[2], 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //draw the elements (just a cube at the moment)
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0, 3);

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

}; //end