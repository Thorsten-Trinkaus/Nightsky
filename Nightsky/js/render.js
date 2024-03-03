const { vec2, vec3, vec4, mat3, mat4, quat} = glMatrix;
{
    const canvasGl = document.getElementById('c1');
    const canvas2D = document.getElementById('c2');
    const canvases = [canvasGl, canvas2D];
    /** @type {WebGLRenderingContext} */
    let gl = canvasGl.getContext('webgl');
    const context2D = canvas2D.getContext('2d');
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
    let textSettings = {
        backgroundStyle:    '#0a0a0a',
        font:               '90px sans-serif',
        shadowColor:        '#D35944',
        shadowOffsetX:      6,
        shadowOffsetY:      6,
        fillStyle:          '#FDE6B0',
        textAlign:          'center',
        text:               'LOADING...'
    }
    document.body.style.backgroundColor = textSettings.backgroundStyle;
    let mouseX = -1;
    let mouseY = -1;
    let selectedStar = null;
    let resizeList = onResize.bind(this);
    let mouseMoveList = onMouseMove.bind(this);
    let mouseUpList = onMouseUp.bind(this);
    let keyUpList = onKeyUp.bind(this);
    window.addEventListener('resize', resizeList);
    window.addEventListener('mousemove', mouseMoveList);
    window.addEventListener('mouseup', mouseUpList);
    window.addEventListener('keyup', keyUpList);
    onResize();
    
    // enabling depth-testing and backface-culling
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);
    const floatColorBufferExtension = gl.getExtension("WEBGL_color_buffer_float");
    const floatExtension = gl.getExtension("OES_texture_float");
    const floatLinearExtension = gl.getExtension("OES_texture_float_linear");
    let idGenVS = gl.createShader(gl.VERTEX_SHADER);
    let shadowGenVS = gl.createShader(gl.VERTEX_SHADER);
    let idGenFS = gl.createShader(gl.FRAGMENT_SHADER);
    let shadowGenFS = gl.createShader(gl.FRAGMENT_SHADER);
    let renderSolidVS = gl.createShader(gl.VERTEX_SHADER);
    let renderSolidFS = gl.createShader(gl.FRAGMENT_SHADER);
    let renderShadedVS = gl.createShader(gl.VERTEX_SHADER);
    let renderShadedFS = gl.createShader(gl.FRAGMENT_SHADER);
    let idGenProgram;
    let shadowGenProgram;
    let renderSolidProgram;
    let renderShadedProgram;
    let textureSize = 4096;
    let clip = [.5, 10000.0];
    let idTexture = gl.createTexture();
    let shadowMapCube = gl.createTexture();
    let idTexFramebuffer = gl.createFramebuffer();
    let idTexRenderbuffer = gl.createRenderbuffer();
    let shadowMapFramebuffer = gl.createFramebuffer();
    let shadowMapRenderbuffer = gl.createRenderbuffer();
    gl.bindTexture(gl.TEXTURE_2D, idTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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
    gl.texParameteri(
        gl.TEXTURE_CUBE_MAP, 
        gl.TEXTURE_MIN_FILTER, 
        gl.LINEAR
    );
    gl.texParameteri(
        gl.TEXTURE_CUBE_MAP, 
        gl.TEXTURE_MAG_FILTER, 
        gl.LINEAR
    );
    gl.texParameteri(
        gl.TEXTURE_CUBE_MAP, 
        gl.TEXTURE_WRAP_S, 
        gl.MIRRORED_REPEAT
    );
    gl.texParameteri(
        gl.TEXTURE_CUBE_MAP, 
        gl.TEXTURE_WRAP_T, 
        gl.MIRRORED_REPEAT
    );
    if (floatExtension && floatLinearExtension) {
        for (let i = 0; i < 6; i++) {
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
        for (let i = 0; i < 6; i++) {
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
    let projMat = mat4.create();
    let shadowMapProj = mat4.create();
    mat4.perspective(
        shadowMapProj, 
        (90/180)*Math.PI,
        1,
        0.5,
        10000.0
    );
    
    function swapCanvas() {
        onResize();
        let can = canvases[0];
        canvases[0] = canvases[1];
        canvases[1] = can;
        canvases[0].style.zIndex = "1"; 
        canvases[1].style.zIndex = "2";
        canvases[0].style.opacity = "0";
        canvases[1].style.opacity = "1";
    }

    
    function genIdMap(clickableObjects, cam) {
        gl.useProgram(idGenProgram);
        gl.bindTexture(gl.TEXTURE_2D, idTexture);
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
        gl.bindFramebuffer(gl.FRAMEBUFFER, idTexFramebuffer);
        gl.bindRenderbuffer(gl.RENDERBUFFER, idTexRenderbuffer);
        gl.renderbufferStorage(
            gl.RENDERBUFFER,
            gl.DEPTH_COMPONENT16,
            canvasGl.width,
            canvasGl.height
        );
        gl.bindFramebuffer(gl.FRAMEBUFFER, idTexFramebuffer);
        gl.bindRenderbuffer(gl.RENDERBUFFER, idTexRenderbuffer);
        gl.viewport(0,0,canvasGl.width, canvasGl.height);
        let mProj = gl.getUniformLocation(idGenProgram, 'mProj');
        let mView = gl.getUniformLocation(idGenProgram, 'mView');
        let mWorld = gl.getUniformLocation(idGenProgram, 'mWorld');
        let id = gl.getUniformLocation(idGenProgram, 'id');
        let vPos = gl.getAttribLocation(idGenProgram, 'vertPos');
        mat4.perspective(
            projMat, 
            cam.angle, 
            canvasGl.width / canvasGl.height, 
            1
        );
        gl.uniformMatrix4fv(mProj, gl.FALSE, projMat);
        gl.uniformMatrix4fv(mView, gl.FALSE, cam.getViewMatrix());
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        for (let i = 0; i < clickableObjects.length; i++) {
            let idd = i + 1;;
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
                8 * Float32Array.BYTES_PER_ELEMENT,
                0
            );
            gl.enableVertexAttribArray(vPos);
            gl.drawArrays(
                gl.TRIANGLES,
                0,
                clickableObjects[i].model.vertices.length/8
            );
        }
        let data = new Uint8Array(4);
        gl.readPixels(
            mouseX, 
            canvasGl.height - mouseY - 1, 
            1, 
            1, 
            gl.RGBA, 
            gl.UNSIGNED_BYTE, 
            data
        );
        let starId =  data[0] + 
            (data[1] << 8) + 
            (data[2] << 16) + 
            (data[3] << 24) - 1;
        if (selectedStar != null) { 
            selectedStar.unselect();
            selectedStar = null;
        }
        if (starId >= 0) {
            selectedStar = clickableObjects[starId];
            selectedStar.select();
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
        let mProj = gl.getUniformLocation(shadowGenProgram, 'mProj');
        let mView = gl.getUniformLocation(shadowGenProgram, 'mView');
        let mWorld = gl.getUniformLocation(shadowGenProgram, 'mWorld');
        let lightPos = gl.getUniformLocation(shadowGenProgram, 'lightPos');
        let shaClip = gl.getUniformLocation(
            shadowGenProgram, 'shadowClipNearFar'
        );
        let vPos = gl.getAttribLocation(shadowGenProgram, 'vertPos');
        gl.uniform2fv(shaClip, clip);
        gl.uniform3fv(lightPos, objectsWithShadows[0].position);
        gl.uniformMatrix4fv(mProj, gl.FALSE, shadowMapProj);
        let shadowCams = objectsWithShadows[0].cams;
        for (let i = 0; i < shadowCams.length; i++) {
            gl.uniformMatrix4fv(
                mView, 
                gl.FALSE, 
                shadowCams[i].getViewMatrix()
            );
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
            for (let j = 0; j < objectsWithShadows.length; j++) {
                gl.uniformMatrix4fv(
                    mWorld, 
                    gl.FALSE, 
                    objectsWithShadows[j].getWorldMats()[0]
                );
                gl.bindBuffer(
                    gl.ARRAY_BUFFER, objectsWithShadows[j].model.buffer
                );
                gl.vertexAttribPointer(
                    vPos, 
                    3, 
                    gl.FLOAT, 
                    gl.FALSE, 
                    8 * Float32Array.BYTES_PER_ELEMENT, 
                    0
                );
                gl.enableVertexAttribArray(vPos);
                gl.drawArrays(
                    gl.TRIANGLES, 
                    0,
                    objectsWithShadows[j].model.vertices.length/8
                );
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
    
    function render(solidObjects, shadedObjects, cam) {
        mat4.perspective(
            projMat,
            cam.angle,
            canvasGl.width / canvasGl.height,
            100
        );
        gl.viewport(0, 0, canvasGl.width, canvasGl.height);
        gl.clearColor(10/255, 10/255, 10/255, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        renderShaded(shadedObjects, cam);
        renderSolid(solidObjects, cam);
    }
    
    function renderSolid(objectsToRender, cam) {
        gl.useProgram(renderSolidProgram);
        let mWorld = gl.getUniformLocation(renderSolidProgram, 'mWorld');
        let mView = gl.getUniformLocation(renderSolidProgram, 'mView');
        let mProj = gl.getUniformLocation(renderSolidProgram, 'mProj');
        let texture = gl.getUniformLocation(renderSolidProgram, 'texture');
        let enableTex = gl.getUniformLocation(
            renderSolidProgram, 'enableTexture'
        );
        let color = gl.getUniformLocation(renderSolidProgram, 'color');
        let brightness = gl.getUniformLocation(
            renderSolidProgram, 'brightness'
        );
        let position = gl.getAttribLocation(renderSolidProgram, 'position');
        let texCoord = gl.getAttribLocation(renderSolidProgram, 'texCoord');
        gl.uniformMatrix4fv(mView, gl.FALSE, cam.getViewMatrix());
        gl.uniformMatrix4fv(mProj, gl.FALSE, projMat);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(texture, 0)
        for (let i = 0; i < objectsToRender.length; i++) {
            if (objectsToRender[i].texture == null) {
                gl.uniform1i(enableTex, 0);
            } else {
                gl.uniform1i(enableTex, 1);
                gl.bindTexture(gl.TEXTURE_2D, objectsToRender[i].texture);
            }
            gl.uniform3fv(color, objectsToRender[i].ambColor);
            gl.uniform1f(brightness, objectsToRender[i].brightness);
            gl.uniformMatrix4fv(
                mWorld,
                gl.FALSE,
                objectsToRender[i].getWorldMats()[0]
            );
            gl.bindBuffer(gl.ARRAY_BUFFER, objectsToRender[i].model.buffer);
            gl.vertexAttribPointer(
                position,
                3,
                gl.FLOAT,
                gl.FALSE,
                8 * Float32Array.BYTES_PER_ELEMENT,
                0
            );
            gl.vertexAttribPointer(
                texCoord,
                2,
                gl.FLOAT,
                gl.FALSE,
                8 * Float32Array.BYTES_PER_ELEMENT,
                6 * Float32Array.BYTES_PER_ELEMENT
            );
            gl.enableVertexAttribArray(position);
            gl.enableVertexAttribArray(texCoord);
            gl.drawArrays(
                gl.TRIANGLES,
                0,
                objectsToRender[i].model.vertices.length/8
            );
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    
    function renderShaded(objectsToRender, cam) {
        gl.useProgram(renderShadedProgram);
        let mWorld = gl.getUniformLocation(renderShadedProgram, 'mWorld');
        let mNormal = gl.getUniformLocation(renderShadedProgram, 'mNormal');
        let mView = gl.getUniformLocation(renderShadedProgram, 'mView');
        let mProj = gl.getUniformLocation(renderShadedProgram, 'mProj');
        let texture = gl.getUniformLocation(renderShadedProgram, 'texture');
        let enableTex = gl.getUniformLocation(
            renderShadedProgram, 'enableTexture'
        );
        let kAmb = gl.getUniformLocation(renderShadedProgram, 'kAmb');
        let kDif = gl.getUniformLocation(renderShadedProgram, 'kDif');
        let kSpe = gl.getUniformLocation(renderShadedProgram, 'kSpe');
        let shininess = gl.getUniformLocation(
            renderShadedProgram, 'shininess'
        );
        let ambColor = gl.getUniformLocation(renderShadedProgram, 'ambColor');
        let difColor = gl.getUniformLocation(renderShadedProgram, 'difColor');
        let speColor = gl.getUniformLocation(renderShadedProgram, 'speColor');
        let brightness = gl.getUniformLocation(
            renderShadedProgram, 'brightness'
        );
        let lightPos = gl.getUniformLocation(
            renderShadedProgram, 'lightPosition'
        );
        let camPos = gl.getUniformLocation(
            renderShadedProgram, 'camPosition'
        );
        let shadMap = gl.getUniformLocation(
            renderShadedProgram,'lightShadowMap'
        );
        let shadClip = gl.getUniformLocation(
            renderShadedProgram, 'shadowClip'
        );
        let bias = gl.getUniformLocation(renderShadedProgram, 'bias');
        let position = gl.getAttribLocation(renderShadedProgram, 'position');
        let normal = gl.getAttribLocation(renderShadedProgram, 'normal');
        let texCoord = gl.getAttribLocation(renderShadedProgram, 'texCoord');
        gl.uniform3fv(lightPos, objectsToRender[0].position);
        gl.uniform3fv(camPos, cam.position);
        gl.uniform2fv(shadClip, clip);
        if (floatExtension && floatLinearExtension) {
            gl.uniform1f(bias, 0.00001);
        } else {
            gl.uniform1f(bias, 0.003);
        }
        gl.uniformMatrix4fv(mProj, gl.FALSE, projMat);
        gl.uniformMatrix4fv(mView, gl.FALSE, cam.getViewMatrix());
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowMapCube);
        gl.uniform1i(shadMap, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(texture, 1);
        gl.uniform3fv(speColor, objectsToRender[0].ambColor);
        for (let i = 0; i < objectsToRender.length; i++) {
            if (objectsToRender[i].texture == null) {
                gl.uniform1i(enableTex, 0);
            } else {
                gl.uniform1i(enableTex, 1);
                gl.bindTexture(gl.TEXTURE_2D, objectsToRender[i].texture);
            }
            gl.uniform1f(kAmb, objectsToRender[i].material.kAmb);
            gl.uniform1f(kDif, objectsToRender[i].material.kDif);
            gl.uniform1f(kSpe, objectsToRender[i].material.kSpe); 
            gl.uniform1f(shininess, objectsToRender[i].material.shininess);
            gl.uniform3fv(ambColor, objectsToRender[i].ambColor);
            gl.uniform3fv(difColor, objectsToRender[i].difColor);
            gl.uniform1f(brightness, objectsToRender[i].brightness);
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
                8 * Float32Array.BYTES_PER_ELEMENT,
                0
            );
            gl.vertexAttribPointer(
                normal,
                3,
                gl.FLOAT,
                gl.FALSE,
                8 * Float32Array.BYTES_PER_ELEMENT,
                3 * Float32Array.BYTES_PER_ELEMENT
            );
            gl.vertexAttribPointer(
                texCoord,
                2,
                gl.FLOAT,
                gl.FALSE,
                8 * Float32Array.BYTES_PER_ELEMENT,
                6 * Float32Array.BYTES_PER_ELEMENT,
                
            );
            gl.enableVertexAttribArray(position);
            gl.enableVertexAttribArray(texCoord);
            gl.enableVertexAttribArray(normal);
            gl.drawArrays(
                gl.TRIANGLES, 
                0, 
                objectsToRender[i].model.vertices.length/8
            );
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
    
    function loadPrograms(vs1,vs2,vs3,vs4,fs1,fs2,fs3,fs4) {
        idGenProgram = createProgram(
            idGenVS, idGenFS, 
            vs1, fs1
        );
        shadowGenProgram = createProgram(
            shadowGenVS, shadowGenFS, 
            vs2, fs2
        );
        renderSolidProgram = createProgram(
            renderSolidVS, renderSolidFS, 
            vs3, fs3
        );
        renderShadedProgram = createProgram(
            renderShadedVS, renderShadedFS, 
            vs4, fs4
        );
    }
    
    //creates and returns a gl program with given shaders
    function createProgram(vertexShader, fragmentShader, vsText, fsText) {
        gl.shaderSource(vertexShader, vsText);
        gl.shaderSource(fragmentShader, fsText);
	    //creating webgl program
	    let program = gl.createProgram();
    
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
        context2D.fillText(
            textSettings.text, 
            canvas2D.width/2, 
            canvas2D.height/2
        );
    }
    
    function onMouseMove(m) {
        let rect = canvasGl.getBoundingClientRect();
        mouseX = m.clientX - rect.left;
        mouseY = m.clientY - rect.top;
    }
    
    function onMouseUp(e) {
        if (selectedStar != null) {
            selectedStar.click(e.button);
        }
    }
    
    function onKeyUp(e) {
        if (selectedStar != null) {
            selectedStar.keyClick(e.code);
        }
    }
    
    function getCanvas() {
        return canvasGl;
    }
    
    function getGLContext() {
        return gl;
    }

}