// glMatrix handles all the vector and matrix operations.
// See https://glmatrix.net/docs/ for the documentation.
const { vec2, vec3, vec4, mat3, mat4, quat} = glMatrix;
{
    // The canvas that will be used for webGL.
    const canvScene = document.getElementById("canvScene");
    // Canvas that displays a loading screen while the webGL 
    // canvas is not ready yet.
    const canvLoading = document.getElementById("canvLoading");
    // List of both canvases. This is used for changing between them.
    const canvases = [canvScene, canvLoading];
    
    // 2D context of the loading screen.
    const context2D = canvLoading.getContext("2d");

    // WebGL context.
    /** @type {WebGLRenderingContext} */
    let gl = canvScene.getContext("webgl");
    // Most modern browsers should support webGL, but it is better 
    // to be safe than sorry.
    if (!gl) {
        alert("webgl not supported \n trying experimental");
        gl = canvScene.getContext("experimental-webgl");
    }
    if (!gl) {
        alert("the browser does not even support experimental-webgl");
    }

    // The settings for the loading screen.
    const textSettings = {
        backgroundStyle:    "#0a0a0a",
        font:               "90px sans-serif",
        shadowColor:        "#D35944",
        shadowOffsetX:      6,
        shadowOffsetY:      6,
        fillStyle:          "#FDE6B0",
        textAlign:          "center",
        text:               "LOADING..."
    }
    // Fill the background of the website to the background color of both the
    // scene and the loading screen.
    document.body.style.backgroundColor = textSettings.backgroundStyle;

    // Mouse positions. These will be updated through onMouseMove() by
    // the mouse move event listener.
    let mouseX = -1;
    let mouseY = -1;

    // The selected object of the scene. This will be set through
    // selectObject() and can be reset using unselectObject().
    let selectedObject = null;

    // Event listener

    // On resize listener to update the canvases accordingly.
    const resizeList = onResize.bind(this);
    window.addEventListener("resize", resizeList);
    // Mouse move listener to update the mouse position.
    const mouseMoveList = onMouseMove.bind(this);
    window.addEventListener("mousemove", mouseMoveList);
    // Mouse up listener to make the selected object clickable.
    const mouseUpList = onMouseUp.bind(this);
    window.addEventListener("mouseup", mouseUpList);
    // Key up listener to make the selected object clickable.
    const keyUpList = onKeyUp.bind(this);
    window.addEventListener("keyup", keyUpList);

    // Update the canvases to fit the current window.
    onResize();
    
    // Enable depth-testing and backface-culling for rendering.
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);           // Specify whether polygons are front- or 
                                    // back-facing by setting a winding 
                                    // orientation to counter-clock-wise.
    gl.cullFace(gl.BACK);           // Specify that back-facing polygons should
                                    // be culled.

    // Enable webGL extensions.

    // This extends WebGLRenderingContext.texImage2D() such that it accepts
    // gl.FLOAT as type and Float32Array for the pixels parameter.
    const floatExtension = gl.getExtension("OES_texture_float");
    // OES_texture_float does not allow for linear filtering with 
    // floating-point textures. This enables the possibility. This is not
    // used here but it is a nice to have.
    const floatLinearExtension = gl.getExtension("OES_texture_float_linear");

    // The vertex and fragment shader needed for all the shader programs.
    // These need to be set through createProgram() before calling any of the
    // rendering functions.
    const selectVS = gl.createShader(gl.VERTEX_SHADER);
    const selectFS = gl.createShader(gl.FRAGMENT_SHADER);
    const shadowGenVS = gl.createShader(gl.VERTEX_SHADER);
    const shadowGenFS = gl.createShader(gl.FRAGMENT_SHADER);
    const renderSolidVS = gl.createShader(gl.VERTEX_SHADER);
    const renderSolidFS = gl.createShader(gl.FRAGMENT_SHADER);
    const renderShadedVS = gl.createShader(gl.VERTEX_SHADER);
    const renderShadedFS = gl.createShader(gl.FRAGMENT_SHADER);
    // The shader programs. Need to be set through loadPrograms() before
    // calling any of the rendering functions.
    let selectProgram;
    let shadowGenProgram;
    let renderSolidProgram;
    let renderShadedProgram;

    // Clipping distances for objects that are too near / far. Null == inf, so
    // all objects will be rendered, no matter how far away.
    const clip = [20.0, null];

    // Texture used by the function selectObject().
    const idTexture = gl.createTexture();
    // Frame- and renderbuffer used by the function selectObject().
    const idTexFramebuffer = gl.createFramebuffer();
    const idTexRenderbuffer = gl.createRenderbuffer();

    // Cube map with depth values for rendering objects with shadows.
    // There is only one point light in the scene, so the shadow cube map
    // will save depth information for each direction from this light source.
    const shadowCubeMap = gl.createTexture();
    // Clipping distances for the cameras used in the generation of the shadow
    // cube map. The second value must be defined in this case, because it is 
    // also used to normalize the depth values to values between 0 and 1.
    const shadowClip = [1.0, 5000.0];
    // Texture size for the cube map used.
    const textureSize = 2048;
    // Frame- and renderbuffer to be used in the generation of the cube map
    // through the function genShadowMap().
    const shadowMapFramebuffer = gl.createFramebuffer();
    const shadowMapRenderbuffer = gl.createRenderbuffer();

    // Bind the idTexture and set its parameter.
    gl.bindTexture(gl.TEXTURE_2D, idTexture);
    // Texture minification filter is set to linear.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Texture magnification filter is set to linear.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // Texture coordinate along the s axis (horizontal direction) that are
    // outside the range will be clamped to the edge of the texture.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // Texture coordinate along the t axis (vertical direction) that are
    // outside the range will be clamped to the edge of the texture.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Bind the shadowCubeMap texture and set its parameter.
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowCubeMap);
    // Texture minification filter is set to linear.
    gl.texParameteri(
        gl.TEXTURE_CUBE_MAP, 
        gl.TEXTURE_MIN_FILTER, 
        gl.LINEAR
    );
    // Texture magnification filter is set to linear.
    gl.texParameteri(
        gl.TEXTURE_CUBE_MAP, 
        gl.TEXTURE_MAG_FILTER, 
        gl.LINEAR
    );
    // Texture coordinate along the s axis (horizontal direction) that are
    // outside the range will repeat the texture mirrored.
    gl.texParameteri(
        gl.TEXTURE_CUBE_MAP, 
        gl.TEXTURE_WRAP_S, 
        gl.MIRRORED_REPEAT
    );
    // Texture coordinate along the t axis (vertical direction) that are
    // outside the range will repeat the texture mirrored.
    gl.texParameteri(
        gl.TEXTURE_CUBE_MAP, 
        gl.TEXTURE_WRAP_T, 
        gl.MIRRORED_REPEAT
    );

    // If the extensions loaded correctly, each cube face will be of type 
    // FLOAT. Else, FLOAT is not a option, so each cube face will be of
    // type UNSIGNED_BYTE.
    if (floatExtension && floatLinearExtension) {
        // For each face.
        for (let i = 0; i < 6; i++) {
            // Specify the i-th face.
            gl.texImage2D(
                gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, // POSITIVE_X
                                                    // +1 -> NEGATIVE_X
                                                    // +1 -> POSITIVE_Y
                                                    // +1 -> NEGATIVE_Y
                                                    // +1 -> POSITIVE_Z
                                                    // +1 -> NEGATIVE_Z
                0,                                  // Base image level.
                gl.RGBA,                            // RGBA color component.
                textureSize,                        // Width. 
                textureSize,                        // Height.
                0,                                  // Border must be 0.
                gl.RGBA,                            // Format of the texture 
                                                    // data. With WebGL 1 this
                                                    // must be the same as the 
                                                    // color component.
                gl.FLOAT,                           // Float for each channel.
                null                                // There is no image linked 
                                                    // to this texture.
            );
        } 
    } else {
        // For each face.
        for (let i = 0; i < 6; i++) {
            // Specify the i-th face.
            gl.texImage2D(
                gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, // POSITIVE_X
                                                    // +1 -> NEGATIVE_X
                                                    // +1 -> POSITIVE_Y
                                                    // +1 -> NEGATIVE_Y
                                                    // +1 -> POSITIVE_Z
                                                    // +1 -> NEGATIVE_Z
                0,                                  // Base image level.
                gl.RGBA,                            // RGBA color component.
                textureSize,                        // Width. 
                textureSize,                        // Height.
                0,                                  // Border must be 0.
                gl.RGBA,                            // Format of the texture 
                                                    // data. With WebGL 1 this
                                                    // must be the same as the 
                                                    // color component.
                gl.UNSIGNED_BYTE,                   // 1 byte for each channel 
                                                    // of the color component.
                null                                // There is no image linked 
                                                    // to this texture.
            );
        }
    }

    // Create and initializes the data storage of the renderbuffer.
    gl.bindRenderbuffer(gl.RENDERBUFFER, shadowMapRenderbuffer);
    gl.renderbufferStorage(
        gl.RENDERBUFFER,
        gl.DEPTH_COMPONENT16,   // Internal format for the renderbuffer
                                // will be 16 depth bits per pixel.
        textureSize,            // Width of the renderbuffer in pixel.
        textureSize             // Height of the renderbuffer in pixel.
    );

    // Unbind textures and buffers for cleanup.
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    // Projection matrix. Will be set for each render function separately.
    const projMat = mat4.create();
    // Projection matrix specifically for the function genShadowMap().
    const shadowMapProj = mat4.create();
    mat4.perspective(
        shadowMapProj, 
        (90/180)*Math.PI,
        1,
        shadowClip[0],
        shadowClip[1]
    );
    
    /**
     * This function swaps between the webGL canvas and the loading screen.
     */
    function swapCanvas() {
        // Update the canvases first.
        onResize();
        // Swap the elements in the canvases list.
        let can = canvases[0];
        canvases[0] = canvases[1];
        canvases[1] = can;
        // Update the visibility of both.
        canvases[0].style.zIndex = "1"; 
        canvases[1].style.zIndex = "2";
        canvases[0].style.opacity = "0";
        canvases[1].style.opacity = "1";
    }

    /**
     * This function removes the selected object by setting it to null.
     */
    function unselectObject() {
        selectedObject = null;
    }
    
    /**
     * This function gets the camera and a list of all the objects in the scene 
     * that should be clickable. It renders all these objects to the idTexture.
     * Afterwards it looks up the position of the mouse cursor and checks if
     * there is a object below the cursor. This object will be selected (set
     * as selectedObject).
     * @param {!CelestialBody[]} clickableObjects - list of objects that can
     *      be clicked
     * @param {!Camera} cam - camera of the scene
     */
    function selectObject(clickableObjects, cam) {

        // Make sure there is something to render.
        if (clickableObjects.length == 0) {
            return;
        }

        // Tell webGL to use the right program.
        gl.useProgram(selectProgram);

        // Bind the texture to which the objects are to be rendered.
        gl.bindTexture(gl.TEXTURE_2D, idTexture);

        // The next steps are done here, because they depend on the
        // current canvas width and height.

        // Specify the 2D texture.
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,                  // Base image level.
            gl.RGBA,            // RGBA color component.
            canvScene.width,    // Texture width.
            canvScene.height,   // Texture height.
            0,                  // Border must be 0.
            gl.RGBA,            // Format of the texture data. For WebGL 1 this
                                // must be the same as the color component.
            gl.UNSIGNED_BYTE,   // 1 byte for each channel of the 
                                // color component.
            null                // There is no image linked to this texture.
        );

        // Specify the frame- and renderbuffer used for the generation 
        // of the idTexture.
        gl.bindFramebuffer(gl.FRAMEBUFFER, idTexFramebuffer);
        gl.bindRenderbuffer(gl.RENDERBUFFER, idTexRenderbuffer);
        // Create and initializes the data storage of the renderbuffer.
        gl.renderbufferStorage(
            gl.RENDERBUFFER,    
            gl.DEPTH_COMPONENT16,   // Internal format for the renderbuffer
                                    // will be 16 depth bits per pixel.
            canvScene.width,        // Width of the renderbuffer in pixel.
            canvScene.height        // Height of the renderbuffer in pixel.
        );
        // Attach the idTexture to the framebuffer.
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,   // Attache the texture to the color buffer.
            gl.TEXTURE_2D,          // 2D texture.
            idTexture,
            0                       // Mipmap Level of the texture image.
                                    // Must be 0.
        );
        // Attach the renderbuffer to the framebuffer.
        gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,    // Attach it to the depth buffer.
            gl.RENDERBUFFER,
            idTexRenderbuffer
        );

        // Set the viewport to the size of the canvas.
        gl.viewport(0, 0, canvScene.width, canvScene.height);

        // Get the location of all the needed parameter for the shader program.
        const mProj = gl.getUniformLocation(selectProgram, "mProj");
        const mView = gl.getUniformLocation(selectProgram, "mView");
        const mWorld = gl.getUniformLocation(selectProgram, "mWorld");
        const id = gl.getUniformLocation(selectProgram, "id");
        const position = gl.getAttribLocation(selectProgram, "position");

        // Set the parameter that stay constant for all the objects.

        // Projection matrix.
        mat4.perspective(
            projMat, 
            cam.angle, 
            canvScene.width / canvScene.height, 
            clip[0],                            // Only visible objects
            clip[1]                             // can be selected.
        );
        gl.uniformMatrix4fv(mProj, gl.FALSE, projMat);
        // View matrix of the camera.
        gl.uniformMatrix4fv(mView, gl.FALSE, cam.getViewMatrix());

        // Clear the color and depth buffers with black.
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Set the rest for each object separately and render the objects.

        // For every object that should be rendered.
        for (let i = 0; i < clickableObjects.length; i++) {
            
            // The index of the object in the list (i) should be used as the
            // color with which the object will be rendered to the texture.
            // From this color value we can later compute which object should
            // be selected. There is a 1 added to the index, because the
            // background is black.
            const idValue = i + 1;
            // This id needs to be split across all color channels, because
            // each channel only allows numbers in [0,1] and putting the id
            // directly as one of the channels would only allow for a very
            // small amount of unique ids.
            // The id will be split into 4 bytes (from the 8 least significant 
            // bits to the 8 most significant). For each byte the value will be
            // divided by the max value (255) so it is in [0,1]. The value of
            // each byte will be set as one of the color channels.
            gl.uniform4fv(id, [
                ((idValue >>  0) & 0xFF) / 0xFF, // 8 least significant bits.
                ((idValue >>  8) & 0xFF) / 0xFF,
                ((idValue >> 16) & 0xFF) / 0xFF,
                ((idValue >> 24) & 0xFF) / 0xFF, // 8 most significant bits.
            ]);

            // World matrix.
            gl.uniformMatrix4fv(
            mWorld,
            gl.FALSE,
            clickableObjects[i].getWorldMats()[0]
            );

            // Bind the buffer of the model that should be used on this object.
            gl.bindBuffer(gl.ARRAY_BUFFER, clickableObjects[i].model.buffer);
            // Tell the program where to find the vertex positions in 
            // the buffer.
            gl.vertexAttribPointer(
                position,
                3,                                  // Each position has 
                                                    // xyz.
                gl.FLOAT,                           // Position coordinates
                                                    // are floats.
                gl.FALSE,                           // Normalization. Does 
                                                    // not matter for 
                                                    // floats.
                8 * Float32Array.BYTES_PER_ELEMENT, // Size per vertex.
                0                                   // Offset. Each vertex
                                                    // starts with the 
                                                    // position.
            );
            
            // Turn on the generic vertex attribute array to use the 
            // attributes.
            gl.enableVertexAttribArray(position);

            // Render the object. It will be rendered to the idTexture.
            gl.drawArrays(
                gl.TRIANGLES,                                // use Triangles.
                0, 
                clickableObjects[i].model.vertices.length / 8 // Amount of 
                                                              // vertices to 
                                                              // draw.
            );
        }

        // Get the object under the mouse cursor (if there is one).

        // We need to reed 4 bytes from the framebuffer (the color 
        // compartments).
        const data = new Uint8Array(4);
        // Read the pixel color under the mouse curser from the color buffer
        // of the framebuffer.
        gl.readPixels(
            mouseX,                         // x position of the cursor 
                                            // in canvas space.
            canvScene.height - mouseY - 1,  // y position of the cursor
                                            // in canvas space.
            1,                              // Only read 1 pixel.
            1,                              // Only read 1 pixel.
            gl.RGBA,                        // Read the RGBA color component
                                            // from the color buffer.
            gl.UNSIGNED_BYTE,               // Data type for each channel of 
                                            // the color component.
            data                            // the result will be saved to the 
                                            // array.
        );
        // Compute back the id from the 4 bytes.
        const starId =  
            data[0]         // First byte.
            + 
            (data[1] << 8)  // Second byte.
            + 
            (data[2] << 16) // Third byte.
            + 
            (data[3] << 24) // fourth byte.
            - 
            1;              // -1 because we added 1 to the index at the start.

        // If there is a object selected right now, call the unselect function
        // of this object and clear the selected object.
        if (selectedObject != null) { 
            selectedObject.unselect();
            selectedObject = null;
        }
        // Select the new object with the index we just computed. If the cursor
        // was not on any object the computed index is -1.
        if (starId >= 0) {
            selectedObject = clickableObjects[starId];
            // Call the select function of the new object.
            selectedObject.select();
        } 

        // Unbind the buffers and the texture used for cleanup.
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * This function generates the shadow cube map needed for rendering objects
     * shaded. This needs to be called before calling renderShaded(). It
     * takes a list of objects, that cast shadows or on which shadows are
     * to be cast. The first object in the list will be used as the light
     * source and does not count as an object itself. This element needs
     * to be of class Star, because this function needs the attached cameras.
     * Using the cameras, the scene will be rendered six times, once for each 
     * face of the cube map. Each pass will capture depth information from the 
     * light perspective in a different direction.
     * @param {!CelestialBody[]} objectsWithShadows - objects that cast shadows 
     *      or on which shadows are to be cast
     */
    function genShadowMap(objectsWithShadows) {

        // Make sure there is something to render.
        if (objectsWithShadows.length == 0) {
            console.warn(
                "There always needs to be a Star "
                + "object when using genShadowMap!"
            );
            return;
        }

        // Tell webGL to use the right program.
        gl.useProgram(shadowGenProgram);

        // Bind the shadow cube map where the shadow map should be stored.
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowCubeMap);
        // Bind the needed buffers.
        gl.bindFramebuffer(gl.FRAMEBUFFER, shadowMapFramebuffer);
        gl.bindRenderbuffer(gl.RENDERBUFFER, shadowMapRenderbuffer);

        // Set the viewport to the texture size used for the shadow map.
        gl.viewport(0, 0, textureSize, textureSize);

        // Get the location of all the needed parameter for the shader program.
        const mProj = gl.getUniformLocation(shadowGenProgram, "mProj");
        const mView = gl.getUniformLocation(shadowGenProgram, "mView");
        const mWorld = gl.getUniformLocation(shadowGenProgram, "mWorld");
        const lightPos = gl.getUniformLocation(shadowGenProgram, "lightPos");
        const shadClip = gl.getUniformLocation(shadowGenProgram, "shadowClip");
        const position = gl.getAttribLocation(shadowGenProgram, "position");

        // Set the parameter that stay constant for all the objects.

        // Clipping distances for shadows of objects that are too close / far.
        gl.uniform2fv(shadClip, shadowClip);
        // Position of the light source. This is the first object in the list.
        // This will not be used as an object itself.
        gl.uniform3fv(lightPos, objectsWithShadows[0].position);
        // Projection matrix.
        gl.uniformMatrix4fv(mProj, gl.FALSE, shadowMapProj);

        // There is a camera for each face of the cube map.
        const shadowCams = objectsWithShadows[0].cams;
        for (let i = 0; i < shadowCams.length; i++) {
            // View matrix of the i-th camera.
            gl.uniformMatrix4fv(
                mView, 
                gl.FALSE, 
                shadowCams[i].getViewMatrix()
            );

            // Attach the correct face of the cube map to the framebuffer.
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER, 
                gl.COLOR_ATTACHMENT0,               // Attach it to the
                                                    // framebuffer's color
                                                    // buffer.
                gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, // i-th face of the cube.
                shadowCubeMap, 
                0                                   // mipmap level of the
                                                    // attached texture. This
                                                    // must be 0 (don't
                                                    // know why tho).
            );

            // Attach the renderbuffer to the framebuffer.
            gl.framebufferRenderbuffer(
                gl.FRAMEBUFFER,
                gl.DEPTH_ATTACHMENT,    // Attach it to the depth buffer of the
                                        // framebuffer.
                gl.RENDERBUFFER,
                shadowMapRenderbuffer
            );

            // Clear the color and depth buffer with white.
            gl.clearColor(1,1,1,1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            // For every object except the light source. This needs to
            // be done 6 times for every object (1 * every face of the cube).
            for (let j = 1; j < objectsWithShadows.length; j++) {
                // Set world matrix.
                gl.uniformMatrix4fv(
                    mWorld, 
                    gl.FALSE, 
                    objectsWithShadows[j].getWorldMats()[0]
                );
                // Bind the buffer of the model that should be used on this 
                // object.
                gl.bindBuffer(
                    gl.ARRAY_BUFFER, objectsWithShadows[j].model.buffer
                );
                // Tell the program where to find the vertex positions in 
                // the buffer.
                gl.vertexAttribPointer(
                    position,
                    3,                                  // Each position has 
                                                        // xyz.
                    gl.FLOAT,                           // Position coordinates
                                                        // are floats.
                    gl.FALSE,                           // Normalization. Does 
                                                        // not matter for 
                                                        // floats.
                    8 * Float32Array.BYTES_PER_ELEMENT, // Size per vertex.
                    0                                   // Offset. Each vertex
                                                        // starts with the 
                                                        // position.
                );
                
                // Turn on the generic vertex attribute array to use the 
                // attributes.
                gl.enableVertexAttribArray(position);

                // Render the object. It will be rendered to the i-th face of 
                // the cube map.
                gl.drawArrays(
                    gl.TRIANGLES,                                // use 
                                                                 // Triangles.
                    0, 
                    // Amount of vertices to draw.
                    objectsWithShadows[j].model.vertices.length / 8
                );
            }
        }

        // Unbind the buffers and the texture used for cleanup.
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
    
    /**
     * This function takes two lists of CelestialBody objects and the camera of
     * the scene. It will render both solid and shaded objects using the 
     * functions renderSolid() and renderShaded(). This function also sets
     * the projection matrix and the viewport and clears the buffers, so this 
     * should be called instead of renderSolid() or renderShaded().
     * @param {!CelestialBody[]} solidObjects - objects that should be rendered
     *      using only ambient colors
     * @param {!CelestialBody[]} shadedObjects - objects that should be 
     *      rendered using phong shading
     * @param {!Camera} cam - camera of the scene
     */
    function render(solidObjects, shadedObjects, cam) {
        // Projection matrix stays constant for both shaders.
        mat4.perspective(
            projMat,
            cam.angle,
            canvScene.width / canvScene.height, // Aspect ratio.
            clip[0],                            // Near bound of the frustum.
            clip[1]                             // Far bound. Can be null for 
                                                // a infinite projection.
        );
        // Set the viewport.
        gl.viewport(0, 0, canvScene.width, canvScene.height);
        // Clear the color and depth buffer with the background color.
        gl.clearColor(10/255, 10/255, 10/255, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Render the shaded objects.
        renderShaded(shadedObjects, cam);
        // Render the objects with only ambient colors.
        renderSolid(solidObjects, cam);
    }
    
    /**
     * This function takes a list of objects and the camera of the scene to
     * render the list of objects flat using only ambient colors 
     * (and textures). This should always be called through render().
     * @param {!CelestialBody[]} objectsToRender - objects that should be
     *      rendered
     * @param {!Camera} cam - the camera of the scene
     */
    function renderSolid(objectsToRender, cam) {

        // Make sure there is something to render.
        if (objectsToRender.length == 0) {
            return;
        }

        // Tell webGL to use the right program.
        gl.useProgram(renderSolidProgram);

        // Get the location of all the needed parameter for the shader program.
        const mWorld = gl.getUniformLocation(renderSolidProgram, "mWorld");
        const mView = gl.getUniformLocation(renderSolidProgram, "mView");
        const mProj = gl.getUniformLocation(renderSolidProgram, "mProj");
        const texture = gl.getUniformLocation(renderSolidProgram, "texture");
        const enableTex = gl.getUniformLocation(
            renderSolidProgram, "enableTexture"
        );
        const color = gl.getUniformLocation(renderSolidProgram, "color");
        const alpha = gl.getUniformLocation(renderSolidProgram, "alpha");
        const position = gl.getAttribLocation(renderSolidProgram, "position");
        const texCoord = gl.getAttribLocation(renderSolidProgram, "texCoord");

        // Set the parameter that stay constant for all the objects.
        
        // The view matrix only depends on the one camera in the scene.
        gl.uniformMatrix4fv(mView, gl.FALSE, cam.getViewMatrix());
        // Projection matrix stays constant for all objects.
        gl.uniformMatrix4fv(mProj, gl.FALSE, projMat);
        // Tell the program that the textures for the objects are at TEXTURE0.
        // The texture itself will be loaded for each Object separately.
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(texture, 0)

        // Set the rest for each object separately and render the objects.

        // For every object that should be rendered.
        for (let i = 0; i < objectsToRender.length; i++) {
            // Set if the there is a texture for this object.
            if (objectsToRender[i].texture == null) {
                gl.uniform1i(enableTex, 0);
            } else {
                gl.uniform1i(enableTex, 1);
                // Load the needed Texture.
                gl.bindTexture(gl.TEXTURE_2D, objectsToRender[i].texture);
            }
            // ambient color
            gl.uniform3fv(color, objectsToRender[i].ambColor);
            // Alpha value of the color.
            gl.uniform1f(alpha, objectsToRender[i].alpha);
            // World matrix. No normal matrix is needed for this shader.
            gl.uniformMatrix4fv(
                mWorld,
                gl.FALSE,
                objectsToRender[i].getWorldMats()[0]
            );
            // Bind the buffer of the model that should be used on this object.
            gl.bindBuffer(gl.ARRAY_BUFFER, objectsToRender[i].model.buffer);
            // Tell the program where to find the vertex positions in 
            // the buffer.
            gl.vertexAttribPointer(
                position,
                3,                                  // Each position has xyz.
                gl.FLOAT,                           // Position coordinates are 
                                                    // floats.
                gl.FALSE,                           // Normalization. Does not
                                                    // matter for floats.
                8 * Float32Array.BYTES_PER_ELEMENT, // Size per vertex.
                0                                   // Offset. Each vertex
                                                    // starts with the 
                                                    // position.
            );
            // Tell the program where to find the vertex texture coordinates in
            // the buffer.
            gl.vertexAttribPointer(
                texCoord,
                2,                                  // Textures only have xy.
                gl.FLOAT,                           // Texture coordinates are 
                                                    // floats.
                gl.FALSE,                           // Normalization. Does not
                                                    // matter for floats.
                8 * Float32Array.BYTES_PER_ELEMENT, // Size per vertex.
                6 * Float32Array.BYTES_PER_ELEMENT, // Offset. 1-3 are position
                                                    // 4-6 are normal.
                
            );
            
            // Turn on the generic vertex attribute array to use the attributes.
            gl.enableVertexAttribArray(position);
            gl.enableVertexAttribArray(texCoord);

            // Render the object.
            gl.drawArrays(
                gl.TRIANGLES,                                // use Triangles.
                0, 
                objectsToRender[i].model.vertices.length / 8 // Amount of 
                                                             // vertices to 
                                                             // draw.
            );
        }

        // Unbind the buffer and the texture used for cleanup.
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    
    /**
     * This function takes a list of objects and the camera of the scene to
     * render the list of objects using phong shading. The first object in the 
     * list will be used as the light source and will not be rendered. 
     * This should always be called through render().
     * @param {!CelestialBody[]} objectsToRender - objects that should be
     *      rendered shaded
     * @param {!Camera} cam - the camera of the scene
     */
    function renderShaded(objectsToRender, cam) {

        // Make sure there is something to render.
        if (objectsToRender.length == 0) {
            return;
        }

        // Tell webGL to use the right program.
        gl.useProgram(renderShadedProgram);

        // Get the location of all the needed parameter for the shader program.
        const mWorld = gl.getUniformLocation(renderShadedProgram, "mWorld");
        const mNormal = gl.getUniformLocation(renderShadedProgram, "mNormal");
        const mView = gl.getUniformLocation(renderShadedProgram, "mView");
        const mProj = gl.getUniformLocation(renderShadedProgram, "mProj");
        const texture = gl.getUniformLocation(renderShadedProgram, "texture");
        const enableTex = gl.getUniformLocation(
            renderShadedProgram, "enableTexture"
        );
        const kAmb = gl.getUniformLocation(renderShadedProgram, "kAmb");
        const kDif = gl.getUniformLocation(renderShadedProgram, "kDif");
        const kSpe = gl.getUniformLocation(renderShadedProgram, "kSpe");
        const shininess = gl.getUniformLocation(
            renderShadedProgram, "shininess"
        );
        const ambColor = gl.getUniformLocation(renderShadedProgram, "ambColor");
        const difColor = gl.getUniformLocation(renderShadedProgram, "difColor");
        const speColor = gl.getUniformLocation(renderShadedProgram, "speColor");
        const alpha = gl.getUniformLocation(renderShadedProgram, "alpha");
        const lightPos = gl.getUniformLocation(
            renderShadedProgram, "lightPosition"
        );
        const camPos = gl.getUniformLocation(
            renderShadedProgram, "camPosition"
        );
        const shadMap = gl.getUniformLocation(
            renderShadedProgram,"lightShadowMap"
        );
        const shadClip = gl.getUniformLocation(
            renderShadedProgram, "shadowClip"
        );
        const bias = gl.getUniformLocation(renderShadedProgram, "bias");
        const position = gl.getAttribLocation(renderShadedProgram, "position");
        const normal = gl.getAttribLocation(renderShadedProgram, "normal");
        const texCoord = gl.getAttribLocation(renderShadedProgram, "texCoord");

        // Set the parameter that stay constant for all the objects.

        // Position of the light source. This is the sun of the current scene 
        // and should always be the first object in the list of objects.
        gl.uniform3fv(lightPos, objectsToRender[0].position);
        // Position of the camera.
        gl.uniform3fv(camPos, cam.position);
        // Clipping distances for shadows of objects that are too close / far.
        gl.uniform2fv(shadClip, shadowClip);
        // Bias for the depth values in the shadowCubeMap. This 
        // should stop flickering of shaded objects.
        if (floatExtension && floatLinearExtension) {
            // This is better, but only available, if both the floatExtension
            // and floatLinearExtension did load correctly.
            gl.uniform1f(bias, 0.00001);    
        } else {
            gl.uniform1f(bias, 0.003);
        }
        // Projection matrix stays constant for all objects.
        gl.uniformMatrix4fv(mProj, gl.FALSE, projMat);
        // The view matrix only depends on the one camera in the scene.
        gl.uniformMatrix4fv(mView, gl.FALSE, cam.getViewMatrix());
        // Load the shadowCubeMap to be at gl.TEXTURE0.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowCubeMap);
        // 0 tells the shader program that it is at TEXTURE0.
        gl.uniform1i(shadMap, 0);
        // Tell the program that the textures for the objects are at TEXTURE1.
        // The texture itself will be loaded for each Object separately.
        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(texture, 1);
        // The specular color of the objects depend on the light source and
        // there only is one.
        gl.uniform3fv(speColor, objectsToRender[0].ambColor);
        
        // Set the rest for each object separately and render the objects.

        // For every object that should be rendered. This does not render the
        // first object in the list, because this should be the light source
        // and the light should not be rendered shaded.
        for (let i = 1; i < objectsToRender.length; i++) {
            // Set if the there is a texture for this object.
            if (objectsToRender[i].texture == null) {
                gl.uniform1i(enableTex, 0);
            } else {
                gl.uniform1i(enableTex, 1);
                // Load the needed Texture.
                gl.bindTexture(gl.TEXTURE_2D, objectsToRender[i].texture);
            }
            // The ambient, diffuse and specular reflection coefficients.
            gl.uniform1f(kAmb, objectsToRender[i].material.kAmb);
            gl.uniform1f(kDif, objectsToRender[i].material.kDif);
            gl.uniform1f(kSpe, objectsToRender[i].material.kSpe); 
            // The phong exponent.
            gl.uniform1f(shininess, objectsToRender[i].material.shininess);
            // Ambient and diffuse color.
            gl.uniform3fv(ambColor, objectsToRender[i].ambColor);
            gl.uniform3fv(difColor, objectsToRender[i].difColor);
            // Alpha value of the color.
            gl.uniform1f(alpha, objectsToRender[i].alpha);
            // World matrix.
            gl.uniformMatrix4fv(
                mWorld, 
                gl.FALSE, 
                objectsToRender[i].getWorldMats()[0]
            );
            // World matrix for normals.
            gl.uniformMatrix4fv(
                mNormal, 
                gl.FALSE, 
                objectsToRender[i].getWorldMats()[1]
            );
            // Bind the buffer of the model that should be used on this object.
            gl.bindBuffer(gl.ARRAY_BUFFER, objectsToRender[i].model.buffer);
            // Tell the program where to find the vertex positions in 
            // the buffer.
            gl.vertexAttribPointer(
                position,
                3,                                  // Each position has xyz.
                gl.FLOAT,                           // Position coordinates are 
                                                    // floats.
                gl.FALSE,                           // Normalization. Does not
                                                    // matter for floats.
                8 * Float32Array.BYTES_PER_ELEMENT, // Size per vertex.
                0                                   // Offset. Each vertex
                                                    // starts with the 
                                                    // position.
            );
            // Tell the program where to find the vertex normals in 
            // the buffer.
            gl.vertexAttribPointer(
                normal,
                3,                                  // Each normal has xyz.
                gl.FLOAT,                           // Normal coordinates are 
                                                    // floats.
                gl.FALSE,                           // Normalization. Does not
                                                    // matter for floats.
                8 * Float32Array.BYTES_PER_ELEMENT, // Size per vertex stays!!
                3 * Float32Array.BYTES_PER_ELEMENT  // Offset, because the
                                                    // first 3 are the
                                                    // position.
            );
            // Tell the program where to find the vertex texture coordinates in
            // the buffer.
            gl.vertexAttribPointer(
                texCoord,
                2,                                  // Textures only have xy.
                gl.FLOAT,                           // Texture coordinates are 
                                                    // floats.
                gl.FALSE,                           // Normalization. Does not
                                                    // matter for floats.
                8 * Float32Array.BYTES_PER_ELEMENT, // Size per vertex.
                6 * Float32Array.BYTES_PER_ELEMENT, // Offset. 1-3 are position
                                                    // 4-6 are normal.
                
            );
            
            // Turn on the generic vertex attribute array to use the attributes.
            gl.enableVertexAttribArray(position);
            gl.enableVertexAttribArray(texCoord);
            gl.enableVertexAttribArray(normal);

            // Render the object.
            gl.drawArrays(
                gl.TRIANGLES,                                // use Triangles.
                0, 
                objectsToRender[i].model.vertices.length / 8 // Amount of 
                                                             // vertices to 
                                                             // draw.
            );
        }

        // Unbind the buffer and the textures used for cleanup.
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
    
    /**
     * This function creates the programs needed to run all render functions.
     * This needs to be called before any render function is used.
     * This should be called on startup from the function main in init.js.
     * @param {!string} vs1 - 
     * @param {!string} vs2 - vertex shader of the shadowGenProgram as a string
     * @param {!string} vs3 - vertex shader of the renderSolidProgram as a 
     *      string
     * @param {!string} vs4 - vertex shader of the renderShadedProgram as a
     *      string
     * @param {!string} fs1 
     * @param {!string} fs2 - fragment shader of the shadowGenProgram as a
     *      string
     * @param {!string} fs3 - fragment shader of the renderSolidProgram as a
     *      string
     * @param {!string} fs4 - fragment shader of the renderShadedProgram as a
     *      string
     */
    function loadPrograms(vs1,vs2,vs3,vs4,fs1,fs2,fs3,fs4) {
        selectProgram = createProgram(
            selectVS, selectFS, 
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

    /**
     * This function creates a webGL program with given shaders. The
     * function will return the new program.
     * @param {!WebGLShader} vertexShader - the vertex shader that 
     *      should be used
     * @param {!WebGLShader} fragmentShader - the fragment shader that 
     *      should be used
     * @param {!string} vsText - text source for the vertex shader
     * @param {!string} fsText - text source for the fragment shader
     * @returns {WebGLProgram} returns the new program
     */
    function createProgram(vertexShader, fragmentShader, vsText, fsText) {
        // Set the source code of the shaders.
        gl.shaderSource(vertexShader, vsText);
        gl.shaderSource(fragmentShader, fsText);

	    // Create the new webGL program.
	    const program = gl.createProgram();
    
        // Compile the GLSL shaders into binary.
        gl.compileShader(vertexShader);
        // Catch any error that happened while compiling.
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
                "ERROR: compile fragment shader!", 
                gl.getShaderInfoLog(fragmentShader)
            );
            return;
        }
    
        // Attach the shaders to the new program.
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        // Link the program, so it can be used.
        gl.linkProgram(program);
        // Catch any error.
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(
                "ERROR linking program!", 
                gl.getProgramInfoLog(program)
            );
            return;
        }
        
        // Validate the program.
        gl.validateProgram(program);
        // Catch any error.
        if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
            console.error(
                "ERROR validating program!", 
                gl.getProgramInfoLog(program)
            );
            return;
        }

        // Return the new program.
	    return program;
    }
    
    /**
     * Function to resize the canvases, viewport and loading text.
     * The function is called every time the size of the window changes 
     * by the resize event listener.
     */
    function onResize() {
        // Resize the webGL canvas.
        canvScene.width = window.innerWidth;
        canvScene.height = window.innerHeight;

        // Update the viewport.
        gl.viewport(0, 0, canvScene.width, canvScene.height);

        // Resize the loading screen.
        canvLoading.width = window.innerWidth;
        canvLoading.height = window.innerHeight;
        // Reset the loading screen.
        context2D.fillStyle = textSettings.backgroundStyle;
        context2D.fillRect(0, 0, canvLoading.width, canvLoading.height);
        // Add the text to the loading screen.
        context2D.font = textSettings.font;
        context2D.shadowColor = textSettings.shadowColor;
        context2D.shadowOffsetX = textSettings.shadowOffsetX;
        context2D.shadowOffsetY = textSettings.shadowOffsetY;
        context2D.fillStyle = textSettings.fillStyle;
        context2D.textAlign = textSettings.textAlign;
        context2D.fillText(
            textSettings.text, 
            canvLoading.width / 2, 
            canvLoading.height / 2
        );
    }
    
    /**
     * This function is called by the mouse move event listener and
     * computes the x,y coordinates of the mouse cursor.
     * @param {!MouseEvent} e - the mouse event happening
     */
    function onMouseMove(e) {
        const rect = canvScene.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    }
    
    /**
     * This function is called by the mouse up event listener.
     * If there is a object currently selected, this function will call
     * the click function of this object with the button relevant to this
     * event.
     * @param {!MouseEvent} e - the mouse event happening
     */
    function onMouseUp(e) {
        if (selectedObject != null) {
            // See the class CelestialBody in celestial.js.
            selectedObject.click(e.button);
        }
    }
    
    /**
     * This function is called by the key up event listener.
     * If there is a object currently selected, this function will call
     * the keyClick function of this object with the key code relevant
     * to this event.
     * @param {!Event} e - the event happening 
     */
    function onKeyUp(e) {
        if (selectedObject != null) {
            // See the class CelestialBody in celestial.js.
            selectedObject.keyClick(e.code);
        }
    }
    
    /**
     * Getter function for the webGl canvas.
     * @returns the webGl canvas
     */
    function getCanvas() {
        return canvScene;
    }
    
    /**
     * Getter function for the webGl context.
     * @returns the webGl context
     */
    function getGLContext() {
        return gl;
    }
}