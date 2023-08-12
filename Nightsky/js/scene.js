
const { vec2, vec3, vec4, mat3, mat4 } = glMatrix;

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
    //getting the html-elements for the canvas
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
    //event-listeners
    var resizeList = onResize.bind(this);
    //adding the needed eventListener
    window.addEventListener("resize", resizeList);

    //resize canvas and viewport to the current browser-window-size
    onResize();

    //enabling depth-testing and backface-culling
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    //create Shaders
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    //setting the shader source code
    gl.shaderSource(vertexShader, vsText);
    gl.shaderSource(fragmentShader,fsText);
    //create gl program (util.js)
    var program = createProgram(gl, vertexShader, fragmentShader);
    
    //system with stars
    var system = new System(gl, 25, 5);
    var stars = [];
    //controllable camera
    var cam = new Camera(
        canvas,
        vec3.fromValues(0,0,100),
        vec3.fromValues(0,0,0),
        vec3.fromValues(0,1,0)
    );

    //frametimes
    var dt = 0;
    var prevFrameTime = 0;
    var currFrameTime = 0;

    //clear color
    var rgb = [29/255,53/255,87/255];

    //basic setup of projection matrix
    var projMatrix = mat4.create();

    //setting up webgl to use the program
    gl.useProgram(program); //could be inside draw() if we need multiple programs

    //start the main loop
    requestAnimationFrame(draw);
    function draw() {
        stars = system.stars;
        //calculate delta-time and setting prev-/currFrameTime for the next draw-call
        currFrameTime = performance.now();
        dt = currFrameTime - prevFrameTime;
        prevFrameTime = currFrameTime;
        //updating the camera-position and camera-rotation
        cam.update(dt);

        //clear with given clearColor
        gl.clearColor(rgb[0], rgb[1], rgb[2], 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //render each star in the starSystem
        for (var i = 0; i < stars.length; i++) {
            //bind buffer of the current star
            gl.bindBuffer(gl.ARRAY_BUFFER, stars[i].model.buffer);

            //get attrib and uniform locations for the shaders
            var positionAttribLocation = gl.getAttribLocation(program, 'position');
	        var normalAttribLocation = gl.getAttribLocation(program, 'normal');
            var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
            var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
            var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');
            var matNormalUniformLocation = gl.getUniformLocation(program, 'mNormal');
            var ambientColorUniformLocation = gl.getUniformLocation(program, 'ambientColor');
            var diffuseColorUniformLocation = gl.getUniformLocation(program, 'diffuseColor');
            var specularColorUniformLocation = gl.getUniformLocation(program, 'specularColor');
            var shininessUniformLocation = gl.getUniformLocation(program, 'shininess');
            var ambientCoefficientUniformLocation = gl.getUniformLocation(program, 'kAmb');
            var diffuseCoefficientUniformLocation = gl.getUniformLocation(program, 'kDif');
            var specularCoefficientUniformLocation = gl.getUniformLocation(program, 'kSpe');
            
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
		        normalAttribLocation,                //attribute-location
		        3,                                  //number of elements per attribute
		        gl.FLOAT,                           //element-type
		        gl.FALSE,                           //webgl needs this to be false to work?
		        6 * Float32Array.BYTES_PER_ELEMENT, //size of 1 vertex
		        3 * Float32Array.BYTES_PER_ELEMENT  //offset
            );
            //enable attribute-array
	        gl.enableVertexAttribArray(positionAttribLocation);
	        gl.enableVertexAttribArray(normalAttribLocation);
    
            //setting the uniforms
            mat4.perspective(
                projMatrix,
                glMatrix.glMatrix.toRadian(45), 
                canvas.width / canvas.height, 
                0.1,                            //near-plane
                1000.0                          //far-plane
            );
            gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, cam.getViewMat());
            gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);
            gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, stars[i].model.wMat);
            gl.uniformMatrix4fv(matNormalUniformLocation, gl.FALSE, stars[i].model.normalWMat);
            gl.uniform3fv(ambientColorUniformLocation, rgb);
            gl.uniform3fv(diffuseColorUniformLocation, stars[i].model.diffuseColor);
            gl.uniform3fv(specularColorUniformLocation, stars[i].model.specularColor);
            gl.uniform1f(shininessUniformLocation, stars[i].model.shininess);
            gl.uniform1f(ambientCoefficientUniformLocation, stars[i].model.kAmb);
            gl.uniform1f(diffuseCoefficientUniformLocation, stars[i].model.kDif);
            gl.uniform1f(specularCoefficientUniformLocation, stars[i].model.kSpe);
            
            //draw the current star
            gl.drawArrays(gl.TRIANGLES, 0, stars[i].model.vertices.length);
            }
        
        //next looop
        requestAnimationFrame(draw);
    }

    //gets triggered by onResize-Listener and resizes the canvas to the current browser-window-size
    function onResize() {
        //resize canvas and viewport to the current browser-window-size
        canvas.width = window.innerWidth - 40;
        canvas.height = window.innerHeight - 40;
        gl.viewport(0,0,canvas.width,canvas.height);
    }
} //end

