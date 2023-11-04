const { vec2, vec3, vec4, mat3, mat4 } = glMatrix;
var canvasGl = document.getElementById('c1');
var canvas2D = document.getElementById('c2');
/** @type {WebGLRenderingContext} */
var gl = canvasGl.getContext('webgl2');
var context2D = canvas2D.getContext('2d');
if (!gl) {
    alert('webgl not supported \n trying experimental');
    gl = canvasGl.getContext('experimental-webgl');
}
if (!gl) {
    alert('the browser does not even support experimental-webgl');
}
if (!context2D) {
    alert('2D context not supported');
}
var textSettings = {
    backgroundStyle:    '#0a0a0a',
    font:               '90px sans-serif',
    shadowColor:        '#D35944',
    shadowOffsetX:      6,
    shadowOffsetY:      6,
    fillStyle:          '#FDE6B0',
    textAlign:          'center',
    text:               'LOADING...'
}
var mouseX = -1;
var mouseY = -1;
var selectedStar = null;
var resizeList = onResize.bind(this);
var mouseMoveList = onMouseMove.bind(this);
var mouseUpList = onMouseUp.bind(this);
var keyDownList = onKeyDown.bind(this);
window.addEventListener('resize', resizeList);
window.addEventListener('mousemove', mouseMoveList);
window.addEventListener('mouseup', mouseUpList);
window.addEventListener('keydown', keyDownList);
onResize();

// enabling depth-testing and backface-culling
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.frontFace(gl.CCW);
gl.cullFace(gl.BACK);
var floatExtension = gl.getExtension("OES_texture_float");
var floatLinearExtension = gl.getExtension("OES_texture_float_linear");
var idGenVS = gl.createShader(gl.VERTEX_SHADER);
var shadowGenVS = gl.createShader(gl.VERTEX_SHADER);
var renderVS = gl.createShader(gl.VERTEX_SHADER);
var idGenFS = gl.createShader(gl.FRAGMENT_SHADER);
var shadowGenFS = gl.createShader(gl.FRAGMENT_SHADER);
var renderFS = gl.createShader(gl.FRAGMENT_SHADER);
var idGenProgram;
var shadowGenProgram;
var renderProgram;
var textureSize = 4096/2;
var clip = [0.05, 10e10];
var idTexture = gl.createTexture();
var shadowMapCube = gl.createTexture();
var idTexFramebuffer = gl.createFramebuffer();
var idTexRenderbuffer = gl.createRenderbuffer();
var shadowMapFramebuffer = gl.createFramebuffer();
var shadowMapRenderbuffer = gl.createRenderbuffer();
gl.bindTexture(gl.TEXTURE_2D, idTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
if (floatExtension && floatLinearExtension) {
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        canvasGl.width,
        canvasGl.height,
        0,
        gl.RGBA,
        gl.FLOAT,
        null
    );
} else {
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        canvasGl.width,
        canvasGl.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
    );
}
gl.bindFramebuffer(gl.FRAMEBUFFER, idTexFramebuffer);
gl.bindRenderbuffer(gl.RENDERBUFFER, idTexRenderbuffer);
gl.renderbufferStorage(
    gl.RENDERBUFFER,
    gl.DEPTH_COMPONENT16,
    canvasGl.width,
    canvasGl.height
);
gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    idTexture,
    0
);
gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.RENDERBUFFER,
    idTexRenderbuffer
);
gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowMapCube);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
if (floatExtension && floatLinearExtension) {
    for (var i = 0; i < 6; i++) {
        gl.texImage2D(
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
            0,
            gl.RGBA,
            textureSize,
            textureSize,
            0,
            gl.RGBA,
            gl.FLOAT,
            null
        );
    } 
} else {
    for (var i = 0; i < 6; i++) {
        gl.texImage2D(
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
            0,
            gl.RGBA,
            textureSize,
            textureSize,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
    }
}
gl.bindFramebuffer(gl.FRAMEBUFFER, shadowMapFramebuffer);
gl.bindRenderbuffer(gl.RENDERBUFFER, shadowMapRenderbuffer);
gl.renderbufferStorage(
    gl.RENDERBUFFER,
    gl.DEPTH_COMPONENT16,
    textureSize,
    textureSize
);
gl.bindTexture(gl.TEXTURE_2D, null);
gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.bindRenderbuffer(gl.RENDERBUFFER, null);
var projMat = mat4.create();
var shadowMapProj = mat4.create();
mat4.perspective(
    shadowMapProj, 
    glMatrix.glMatrix.toRadian(90),
    1,
    clip[0],
    clip[1]
);

function start() {
    canvasGl.style.zIndex = "2";
    canvas2D.style.zIndex = "1";
    onResize();
}

function genIdMap(clickableObjects, cam) {
    gl.useProgram(idGenProgram);
    gl.bindTexture(gl.TEXTURE_2D, idTexture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, idTexFramebuffer);
    gl.bindRenderbuffer(gl.RENDERBUFFER, idTexRenderbuffer);
    gl.viewport(0,0,canvasGl.width, canvasGl.height);
    var mProj = gl.getUniformLocation(idGenProgram, 'mProj');
    var mView = gl.getUniformLocation(idGenProgram, 'mView');
    var mWorld = gl.getUniformLocation(idGenProgram, 'mWorld');
    var id = gl.getUniformLocation(idGenProgram, 'id');
    var vPos = gl.getAttribLocation(idGenProgram, 'vertPos');
    mat4.perspective(
        projMat, 
        glMatrix.glMatrix.toRadian(45), 
        canvasGl.width / canvasGl.height, 
        0.05, 10e8
    );
    gl.uniformMatrix4fv(mProj, gl.FALSE, projMat);
    gl.uniformMatrix4fv(mView, gl.FALSE, cam.getViewMat());
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for (var i = 0; i < clickableObjects.length; i++) {
        var idd = i + 1;;
        gl.uniform4fv(id, [
            ((idd >>  0) & 0xFF) / 0xFF,
            ((idd >>  8) & 0xFF) / 0xFF,
            ((idd >> 16) & 0xFF) / 0xFF,
            ((idd >> 24) & 0xFF) / 0xFF,
        ]);
        gl.uniformMatrix4fv(
          mWorld,
          gl.FALSE,
          clickableObjects[i].getWorldMats()[0]
        );
        gl.bindBuffer(gl.ARRAY_BUFFER, clickableObjects[i].model.buffer);
        gl.vertexAttribPointer(
            vPos,
            3,
            gl.FLOAT,
            gl.FALSE,
            6 * Float32Array.BYTES_PER_ELEMENT,
            0
        );
        gl.enableVertexAttribArray(vPos);
        gl.drawArrays(
            gl.TRIANGLES,
            0,
            clickableObjects[i].model.vertices.length
        );
    }
    var data = new Uint8Array(4);
    gl.readPixels(mouseX * gl.canvas.width / gl.canvas.clientWidth, gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
    var starId =  data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24) - 1;
    if (selectedStar != null) { 
        selectedStar.scale = vec3.fromValues(50,50,50);
        selectedStar = null;
    }
    if (starId >= 0) {
        selectedStar = clickableObjects[starId];
        selectedStar.scale = vec3.fromValues(200,200,200);
    } 
    
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function genShadowMap(objectsWithShadows) {
    gl.useProgram(shadowGenProgram);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowMapCube);
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowMapFramebuffer);
    gl.bindRenderbuffer(gl.RENDERBUFFER, shadowMapRenderbuffer);
    gl.viewport(0,0,textureSize,textureSize);
    var mProj = gl.getUniformLocation(shadowGenProgram, 'mProj');
    var mView = gl.getUniformLocation(shadowGenProgram, 'mView');
    var mWorld = gl.getUniformLocation(shadowGenProgram, 'mWorld');
    var lightPos = gl.getUniformLocation(shadowGenProgram, 'lightPos');
    var shaClip = gl.getUniformLocation(shadowGenProgram, 'shadowClipNearFar');
    var vPos = gl.getAttribLocation(shadowGenProgram, 'vertPos');
    gl.uniform2fv(shaClip, clip);
    gl.uniform3fv(lightPos, objectsWithShadows[0].position);
    gl.uniformMatrix4fv(mProj, gl.FALSE, shadowMapProj);
    var shadowCams = objectsWithShadows[0].cams;
    for (var i = 0; i < shadowCams.length; i++) {
        gl.uniformMatrix4fv(mView, gl.FALSE, shadowCams[i].getViewMat());
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, 
            gl.COLOR_ATTACHMENT0, 
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 
            shadowMapCube, 
            0
        );
        gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.RENDERBUFFER,
            shadowMapRenderbuffer
        );
        gl.clearColor(1,1,1,1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        for (var j = 0; j < objectsWithShadows.length; j++) {
            gl.uniformMatrix4fv(
                mWorld, 
                gl.FALSE, 
                objectsWithShadows[j].getWorldMats()[0]
            );
            gl.bindBuffer(gl.ARRAY_BUFFER, objectsWithShadows[j].model.buffer);
            gl.vertexAttribPointer(
                vPos, 
                3, 
                gl.FLOAT, 
                gl.FALSE, 
                6 * Float32Array.BYTES_PER_ELEMENT, 
                0
            );
            gl.enableVertexAttribArray(vPos);
            gl.drawArrays(
                gl.TRIANGLES, 
                0,
                objectsWithShadows[j].model.vertices.length
            );
        }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
}

function render(objectsWithShadows, objectsToRender, cam) {
    gl.useProgram(renderProgram);
    mat4.perspective(
        projMat, 
        glMatrix.glMatrix.toRadian(45), 
        canvasGl.width / canvasGl.height, 
        0.05, 10e8
    );
    gl.viewport(0,0,canvasGl.width, canvasGl.height);
    gl.clearColor(10/255, 10/255, 10/255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var kAmb = gl.getUniformLocation(renderProgram, 'kAmb');
    var kDif = gl.getUniformLocation(renderProgram, 'kDif');
    var kSpe = gl.getUniformLocation(renderProgram, 'kSpe');
    var shininess = gl.getUniformLocation(renderProgram, 'shininess');
    var ambientColor = gl.getUniformLocation(renderProgram, 'ambientColor');
    var diffuseColor = gl.getUniformLocation(renderProgram, 'diffuseColor');
    var specularColor = gl.getUniformLocation(renderProgram, 'specularColor');
    var lightPos = gl.getUniformLocation(renderProgram, 'lightPos');
    var viewPos = gl.getUniformLocation(renderProgram, 'viewPos');
    var lightShadowMap = gl.getUniformLocation(renderProgram,'lightShadowMap');
    var shaClip = gl.getUniformLocation(renderProgram, 'shadowClipNearFar');
    var bias = gl.getUniformLocation(renderProgram, 'bias');
    var mode = gl.getUniformLocation(renderProgram, 'mode');
    var position = gl.getAttribLocation(renderProgram, 'position');
    var normal = gl.getAttribLocation(renderProgram, 'normal');
    var mProj = gl.getUniformLocation(renderProgram, 'mProj');
    var mView = gl.getUniformLocation(renderProgram, 'mView');
    var mWorld = gl.getUniformLocation(renderProgram, 'mWorld');
    var mNormal = gl.getUniformLocation(renderProgram, 'mNormal');
    gl.uniform3fv(lightPos, objectsToRender[0].position);
    gl.uniform3fv(viewPos, cam.pos);
    gl.uniform1i(lightShadowMap, 0);
    gl.uniform2fv(shaClip, clip);
    if (this.floatExtension && this.floatLinearExtension) {
        gl.uniform1f(bias, 0.00001);
    } else {
        gl.uniform1f(bias, 0.003);
    }
    gl.uniformMatrix4fv(mProj, gl.FALSE, projMat);
    gl.uniformMatrix4fv(mView, gl.FALSE, cam.getViewMat());
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowMapCube);
    for (var i = 0; i < objectsToRender.length; i++) {
        if (i == 0 || i >= objectsWithShadows.length) {
            gl.uniform1i(mode, 0);
        } else {
            gl.uniform1i(mode, 1);
        }
        gl.uniform1f(kAmb, objectsToRender[i].material.kAmb);
        gl.uniform1f(kDif, objectsToRender[i].material.kDif);
        gl.uniform1f(kSpe, objectsToRender[i].material.kSpe); 
        gl.uniform1f(shininess, objectsToRender[i].material.shininess);
        gl.uniform3fv(ambientColor, objectsToRender[i].ambColor);
        gl.uniform3fv(diffuseColor, objectsToRender[i].difColor);
        gl.uniform3fv(specularColor, objectsToRender[i].speColor);
        gl.uniformMatrix4fv(
            mWorld, 
            gl.FALSE, 
            objectsToRender[i].getWorldMats()[0]
        );
        gl.uniformMatrix4fv(
            mNormal, 
            gl.FALSE, 
            objectsToRender[i].getWorldMats()[1]
        );
        gl.bindBuffer(gl.ARRAY_BUFFER, objectsToRender[i].model.buffer);
        gl.vertexAttribPointer(
            position,
            3,
            gl.FLOAT,
            gl.FALSE,
            6 * Float32Array.BYTES_PER_ELEMENT,
            0
        );
        gl.vertexAttribPointer(
            normal,
            3,
            gl.FLOAT,
            gl.FALSE,
            6 * Float32Array.BYTES_PER_ELEMENT,
            3 * Float32Array.BYTES_PER_ELEMENT
        );
        gl.enableVertexAttribArray(position);
        gl.enableVertexAttribArray(normal);
        gl.drawArrays(
            gl.TRIANGLES, 
            0, 
            objectsToRender[i].model.vertices.length
        );
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}

function loadPrograms(vs1,vs2,vs3,fs1,fs2,fs3) {
    idGenProgram = createProgram(idGenVS, idGenFS, vs1, fs1);
    shadowGenProgram = createProgram(shadowGenVS, shadowGenFS, vs2, fs2);
    renderProgram = createProgram(renderVS, renderFS, vs3, fs3);
}

//creates and returns a gl program with given shaders
function createProgram(vertexShader, fragmentShader, vsText, fsText) {
    gl.shaderSource(vertexShader, vsText);
    gl.shaderSource(fragmentShader, fsText);
	//creating webgl program
	var program = gl.createProgram();

    //compile the shaders
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error(
            "ERROR: compile vertex shader!",
            gl.getShaderInfoLog(vertexShader)
        );
        return;
    }
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error(
            'ERROR: compile fragment shader!', 
            gl.getShaderInfoLog(fragmentShader)
        );
        return;
    }

    //attach the shaders to the program
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    //link program
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) {
        console.error(
            'ERROR linking program!', 
            gl.getProgramInfoLog(program)
        );
        return;
    }
    //validate program
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error(
            'ERROR validating program!', 
            gl.getProgramInfoLog(program)
        );
        return;
    }
	return program;
}

function onResize() {
    canvasGl.width = window.innerWidth;
    canvasGl.height = window.innerHeight;
    gl.viewport(0,0,canvasGl.width,canvasGl.height);
    canvas2D.width = window.innerWidth;
    canvas2D.height = window.innerHeight;
    context2D.fillStyle = textSettings.backgroundStyle;
    context2D.fillRect(0,0,canvas2D.width, canvas2D.height);
    context2D.font = textSettings.font;
    context2D.shadowColor = textSettings.shadowColor;
    context2D.shadowOffsetX = textSettings.shadowOffsetX;
    context2D.shadowOffsetY = textSettings.shadowOffsetY;
    context2D.fillStyle = textSettings.fillStyle;
    context2D.textAlign = textSettings.textAlign;
    context2D.fillText(textSettings.text, canvas2D.width/2, canvas2D.height/2);
}

function onMouseMove(m) {
    var rect = canvasGl.getBoundingClientRect();
    mouseX = m.clientX - rect.left;
    mouseY = m.clientY - rect.top;
}

function onMouseUp(e) {
    if (e.button == 1) {
        if (selectedStar != null) {
            addConnector(selectedStar);
        }
    }
}

function onKeyDown(e) {
    if (e.code == "Digit1") {
        if (selectedStar != null) {
            loading(selectedStar.index);
        }
    }
}

function getCanvas() {
    return canvasGl;
}