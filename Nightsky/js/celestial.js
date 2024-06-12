/**
 * A basic class for celestial bodys.
 * This class covers basic parameter and methods.
 */
class CelestialBody {
    /**
     * @constructor
     * @param {!Model} model - the model of this body
     * @param {?HTMLImageElement} texture - two-dimensional texture to 
     *      be used on the model | null if no texture should be used
     * @param {![number, number, number]} position - xyz world-coordinates
     * @param {![number, number, number]} scale - scaling of the model 
     *      in xyz directions
     * @param {!Material} material - material used for shading this body
     * @param {![number, number, number]} ambColor - ambient color of this body 
     *      in rgb [0,1]
     * @param {![number, number, number]} difColor - diffuse color of this body 
     *      in rgb [0,1]
     * @param {![number, number, number]} speColor - specular color of this 
     *      body in rgb [0,1]
     * @param {!number} alpha - alpha value for the color of this body
     * @param {number} index - index can be used to identify this body
     */
    constructor(
        model, texture, position, scale, 
        material, ambColor, difColor, speColor,
        alpha, index = -1
    ) {
        this.model = model;
        this.texture = null;
        if (texture != null) {
            this.updateTexture(texture);
        }
        this.position = position;
        this.scale = scale;
        this.material = material;
        this.ambColor = ambColor;
        this.difColor = difColor;
        this.speColor = speColor;
        this.alpha = alpha;
        this.index = index;
    }

    /**
     * Use this method to add, update or remove the texture of this body.
     * @param {?HTMLImageElement} texture - new two-dimensional texture |
     *      null removes the current texture
     */
    updateTexture(texture) {
        /** @type {WebGLRenderingContext} */
        const gl = getGLContext();
        // Case null: Current texture should be removed.
        if (texture == null) {
            this.texture = null;
            return;
        }
        // Create a new WebGL texture if there is no current texture.
        if (this.texture == null) {
            this.texture = gl.createTexture();
        }
        // Bind the new texture.
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(
            gl.TEXTURE_2D, 
            0, 
            gl.RGBA,
            gl.RGBA, 
            gl.UNSIGNED_BYTE, 
            texture
        );
        // Setting the needed texture parameter.
        {
            // Setting the magnification filter to linear.
            gl.texParameteri(
                gl.TEXTURE_2D, 
                gl.TEXTURE_MIN_FILTER, 
                gl.LINEAR
            );
            // Setting the minification filter to linear
            gl.texParameteri(
                gl.TEXTURE_2D, 
                gl.TEXTURE_MAG_FILTER, 
                gl.LINEAR
            );
            // Setting the wrapping functions for 
            // both texture coordinates to clamp to edge.
            gl.texParameteri(
                gl.TEXTURE_2D, 
                gl.TEXTURE_WRAP_S, 
                gl.CLAMP_TO_EDGE
            );
            gl.texParameteri(
                gl.TEXTURE_2D, 
                gl.TEXTURE_WRAP_T, 
                gl.CLAMP_TO_EDGE
            );
        }
        // Unbind the texture.
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * Use this method to get both the world-matrix 
     * and the matrix to transform normals.
     * @returns {[glMatrix.mat4, glMatrix.mat4]} 
     *      returns both matrices in one array
     */
    getWorldMats() {
        const worldMat = mat4.create();
        const normalWorldMat = mat4.create();
        // Calculate the world-matrix by scaling 
        // and transforming into world-coordinates.
        mat4.fromRotationTranslationScale(
            worldMat,
            quat.create(), 
            this.position, 
            this.scale,
        );
        // Calculate the matrix for normals.
        mat4.invert(normalWorldMat, worldMat);
        mat4.transpose(normalWorldMat, normalWorldMat);
        // Return both matrices.
        return[worldMat, normalWorldMat];
    }

    /**
     * Call this method when this body is selected.
     * The method sets the UI-infotext to display basic 
     * information about this body (position and scale).
     */
    select() {
        setInfoText(
            "position: [" + Math.round(this.position[0]) +
            ", " + Math.round(this.position[1]) +
            ", " + Math.round(this.position[2]) + "]\r\n" +
            "scale: [" + Math.round(this.scale[0]) +
            ", " + Math.round(this.scale[1]) +
            ", " + Math.round(this.scale[2]) + "]"
        );
    }

    /**
     * Call this method when this body is no longer selected.
     * The method resets the UI-infotext.
     */
    unselect() {
        setInfoText("nothing selected");
    }

    /**
     * This method is called if this body is selected and a mouse-button is 
     * pressed.
     * @param {!Event.button} button - button-code of a mousedown-eventlistener
     */
    click(button) {}

    /**
     * This method is called if this body is selected and a key is pressed.
     * @param {!Event.code} code - key-code of a keydown-eventlistener
     */
    keyClick(code) {}
}

/**
 * A class to represent the sun of the current solar system.
 * Objects of this class will always be placed at world-coordinates [0,0,0].
 * There should only be one object of this class at a time. 
 * Stars will only use ambient colors. The Star will be used as the light
 * source of the scene.
 * @extends CelestialBody
 */
class Star extends CelestialBody {
    /**
     * @constructor
     * @param {!Model} model - the model of this star
     * @param {?HTMLImageElement} texture - two-dimensional texture to 
     *      be used on the model | null if no texture should be used
     * @param {![number, number, number]} scale - scaling of the model 
     *      in xyz directions
     * @param {![number, number, number]} color - color of this star 
     *      in rgb [0,1] | this value is also used as the specular color 
     *      for the orbiting bodys of this star
     * @param {!number} alpha - alpha value of the color of this star
     * @param {!number} index - index to identify this star
     */
    constructor(model, texture, scale, color, alpha, index) {
        // Calls constructor of the parent class.
        super(
            model, 
            texture, 
            [0,0,0],            // Placed at world-coordinates [0,0,0].
            scale, 
            basicMaterials.amb, // Only use ambient colors for rendering.
                                // BasicMaterials is defined in material.js.
            color,
            color,
            color,
            alpha,
            index
        );
        // Six Camera-objects to be used in shadow generation.
        // This is placed here because the current star is used as the 
        // only light source in the current solar system.
        // A better description of the shadow generation can be found in 
        // render.js at the function genShadowMap.
        this.cams = [
            new Camera(
                [0, 0, 0],
                vec3.fromValues(1, 0, 0),
                vec3.fromValues(0, -1, 0),
                Math.PI / 2                     // 90 dec
            ),
            new Camera(
                [0, 0, 0],
                vec3.fromValues(-1, 0, 0),
                vec3.fromValues(0, -1, 0),
                Math.PI / 2
            ),
            new Camera(
                [0, 0, 0],
                vec3.fromValues(0, 1, 0),
                vec3.fromValues(0, 0, 1),
                Math.PI / 2
            ),
            new Camera(
                [0, 0, 0],
                vec3.fromValues(0, -1, 0),
                vec3.fromValues(0, 0, -1),
                Math.PI / 2
            ),
            new Camera(
                [0, 0, 0],
                vec3.fromValues(0, 0, 1),
                vec3.fromValues(0, -1, 0),
                Math.PI / 2
            ),
            new Camera(
                [0, 0, 0],
                vec3.fromValues(0, 0, -1),
                vec3.fromValues(0, -1, 0),
                Math.PI / 2
            ),
        ];
        // A list of all the objects that orbit around this star.
        this.objects = [];
    }

    /**
     * @override
     * Call this method when this body is selected.
     * The method sets the UI-infotext to basic information about this star.
     */
    select() {
        super.select();
        setInfoText("STAR\r\n" + getInfoText());
    }

    /**
     * Use this method to add a new object that orbits around this star.
     * The object will be added to the list of objects (this.objects) 
     * that orbit this star. The object will be of the OrbitingObject class.
     * The method returns the new object.
     * @param {!Model} model - the model of the object
     * @param {?HTMLImageElement} texture - two-dimensional texture to 
     *      be used on the model | null if no texture should be used
     * @param {![number, number, number]} relativePosition - xyz coordinates 
     *      relative to this star
     * @param {![number, number, number]} scale - scaling of the model 
     *      in xyz directions
     * @param {!Material} material - material used for shading the object
     * @param {![number, number, number]} ambColor - ambient color of the 
     *      object in rgb [0,1]
     * @param {![number, number, number]} difColor - diffuse color of the 
     *      object in rgb [0,1]
     * @param {!number} alpha - alpha value of the color of the object
     * @param {![number, number, number]} rotObject - angular momentum 
     *      of the new object around x,y,z-axis in object-space
     * @param {![number, number, number]} rotRoot - rotation of the orbit
     *      around x,y,z-axis in the object-space of this star (in dec)
     * @param {!number} rotSpeed - speed at which this object 
     *      rotates around itself 
     * @param {!number} orbitSpeed - speed at which this object
     *      orbits around its root
     * @returns {OrbitingObject} the method returns the new object
     */
    addObject(
        model, texture, relativePosition, scale,
        material, ambColor, difColor, alpha, 
        rotObject, rotRoot, rotSpeed, orbitSpeed
    ) {
        this.objects.push(new OrbitingObject(
            model,
            texture,
            this,               // Set this star as the root of the new object.
            relativePosition,
            scale,
            material,
            ambColor,
            difColor,      
            this.ambColor,      // Use the color of the star as specular color.
            alpha,
            rotObject,
            rotRoot,
            rotSpeed,
            orbitSpeed
        ));
        return this.objects[this.objects.length-1];
    }

    /**
     * Use this method to get a list of all the objects that orbit around this
     * star. The list is split into a list of objects and a list of orbits. 
     * This method works recursively to also get the objects orbiting other 
     * orbiting objects.
     * @returns {[OrbitingObject[], CelestialBody[]]} returns the two lists
     *      (the orbits will be either of class Connector in the case of 
     *      dynamic orbits or StaticOrbit)
     */
    getObjects() {
        let objs = [[],[]];
        let indirectObjs = [];
        for (let i = 0; i < this.objects.length; i++) {
            indirectObjs = this.objects[i].getObjects();
            objs[0] = objs[0]
                .concat([this.objects[i]])
                .concat(indirectObjs[0]);
            objs[1] = objs[1].concat(indirectObjs[1]);
        }
        return objs;
    }

    /**
     * Use this method to update the position of all the orbiting objects.
     * @param {!number} time - time for which the objects are to be updated
     * @param {!number} speed - multiplier for the movement speed
     */
    update(time, speed) {
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].update(time, speed);
        }
    }
}

/**
 * A class to represent objects that orbit other CelestialBodys.
 * A OrbitingObject can also orbit another OrbitingObject.
 * @extends CelestialBody
 */
class OrbitingObject extends CelestialBody {
    /**
     * @constructor
     * @param {!Model} model - the model of this object
     * @param {?HTMLImageElement} texture - two-dimensional texture to 
     *      be used on the model | null if no texture should be used
     * @param {!CelestialBody} root - the object to be orbited
     * @param {![number, number, number]} relativePosition - xyz coordinates 
     *      relativ to the position of the root-object
     * @param {![number, number, number]} scale - scaling of the model 
     *      in xyz directions
     * @param {!Material} material - material used for shading this object
     * @param {![number, number, number]} ambColor - ambient color of this 
     *      object in rgb [0,1]
     * @param {![number, number, number]} difColor - diffuse color of this 
     *      object in rgb [0,1]
     * @param {![number, number, number]} speColor - specular color of this 
     *      object in rgb [0,1]
     * @param {!number} alpha - alpha value of the color of the object
     * @param {![number, number, number]} rotObject - angular momentum 
     *      around x,y,z-axis in object-space
     * @param {![number, number, number]} rotRoot - rotation of the orbit
     *      around x,y,z-axis in root-object-space (in dec)
     * @param {!number} rotSpeed - speed at which this object 
     *      rotates around itself 
     * @param {!number} orbitSpeed - speed at which this object
     *      orbits around its root
     */
    constructor(
        model, texture, root, relativePosition, scale, 
        material, ambColor, difColor, speColor,
        alpha, rotObject, rotRoot, rotSpeed, orbitSpeed
        
    ) {
        // Calls constructor of the parent class.
        super(
            model, 
            texture, 
            relativePosition,   // This defines the position, so please note
                                // that this.position only represents the 
                                // position relative to the root.
            scale, 
            material, 
            ambColor, 
            difColor, 
            speColor,      
            alpha
        );
        this.root = root;
        // The angular momentum in object space.
        this.rotObject = rotObject;
        // Rotation quat for rotating the object in object space.
        // This will be update every time the object updates (update()) by
        // using the angular momentum.
        this.rotationObject = quat.create();
        quat.fromEuler(this.rotationObject, 0, 0, 0);
        this.rotationRoot = quat.create();
        quat.fromEuler(
            this.rotationRoot, rotRoot[0], rotRoot[1], rotRoot[2]
        );
        this.rotSpeed = rotSpeed;
        this.orbitSpeed = orbitSpeed;
        // This can be used to visualize the orbit of this object.
        // There are two ways to add a orbit 
        // 1. addStaticOrbit() adds a object (class StaticOrbit) with a special
        // orbit-model. This is easy and only needs one object, but does not 
        // scale well.
        // 2. addDynamicOrbit() adds a custom orbit using the Connector class.
        // Great scaling, but needs a lot of objects.
        this.orbit = [];  
        // The origin of the orbit. This helps updating the position of the 
        // orbit if a dynamic orbit is used.
        this.orbitOrigin = this.getRootPosition(); 
        // A list of all the objects that orbit around this object.
        this.objects = [];
    }

    /**
     * This method calculates the position of the root-object.
     * It can be used to get the true position of this object, because
     * this.position is relative to the position of the root-object.
     * @returns {[number, number, number]} returns the position of the 
     *      root-object
     */
    getRootPosition() {
        let rootPosition = vec3.create();
        // If the root-object is also a OrbitingObject, the position of the 
        // root-object is relative to its root. In this case it is necessary 
        // to call this method for the root as well.
        // Else, just return the position of the root-object.
        if (this.root instanceof OrbitingObject) {
            vec3.add(
                rootPosition, 
                this.root.position, 
                this.root.getRootPosition()
            );
            // To get the true position of the root object, it is needed
            // to rotate the root object around its root.
            const rotMat = mat4.create();
            mat4.fromRotationTranslationScaleOrigin(
                rotMat, 
                this.root.rotationRoot,
                vec3.create(),
                vec3.fromValues(1,1,1),
                this.root.getRootPosition()
            );
            vec3.transformMat4(
                rootPosition,
                rootPosition,
                rotMat
            );
        } else {
            rootPosition = vec3.clone(this.root.position);
        }
        return rootPosition;
    }

    /**
     * This method can be used to add the orbit of this object as a separate
     * object. This makes it possible to visualize the orbit. A StaticOrbit 
     * is used for this. This is simple, but does not scale well. If scaling 
     * is important, use addDynamicOrbit() instead.
     */
    addStaticOrbit() {
        this.orbit = new StaticOrbit(this);
    }

    /**
     * ⁤Just as addStaticOrbit(), this method can be used to add the orbit. ⁤
     * ⁤Instead of a single object, this method uses multiple objects of the 
     * Connector class. ⁤⁤This makes the process more complex and produces 
     * additional memory and computing costs. ⁤⁤Use this method if the scaling 
     * of the orbit is an important factor.
     * @param {number} steps - this defines how many objects are used for
     *      creating the orbit. More steps produce a more round-looking orbit,
     *      but adds computational cost. The amount of steps should always be 
     *      positive. This parameter is optional and a base value of 100 is 
     *      used if there is no input.
     */
    addDynamicOrbit(steps = 100) {
        this.orbit = [];
        // This is the radius of the orbit.
        const r = vec3.length(this.position);
        // These are used in the for loop.
        let pos;
        let pos4;
        // This loop goes around the orbit in a circle and adds placeholder
        // objects to later add Connectors around the orbit.
        for (let phi = 0; phi < 2 * Math.PI; phi += 2 * Math.PI / steps) {
            // Compute the position on the circle.
            pos = vec3.fromValues(
                r * Math.sin(phi),
                0,
                r * Math.cos(phi),
            );
            // Rotate the position using homogeneous coordinates.
            pos4 = vec4.fromValues(pos[0],pos[1],pos[2],1);
            vec4.transformQuat(pos4, pos4, this.rotationRoot);
            pos = vec3.fromValues(
                pos4[0] / pos4[3],
                pos4[1] / pos4[3],
                pos4[2] / pos4[3]
            );
            // Compute the true position by adding the position of the 
            // orbit-center.
            vec3.add(pos, pos, this.getRootPosition());
            // Create a placeholder at the position. The placeholder will 
            // get removed later. Because of this, the only parameter that 
            // matters here is the position.
            this.orbit.push(new CelestialBody(
                getModel('circle'),
                null,               
                vec3.clone(pos),
                [1, 1, 1], 
                basicMaterials.amb, 
                [0, 0, 0], 
                [0, 0, 0], 
                [0, 0, 0], 
                1
            ));
        }
        // Amount of placeholder-objects.
        const length = this.orbit.length;
        // Add the first Connector between the first and last 
        // placeholder-objects.
        this.orbit.push(new Connector(
            this.orbit[0],
            this.orbit[this.orbit.length-1],
            0,
            [1, 1, 1],
            1
        ));
        // Remove the select / unselect methods of the new Connector.
        this.orbit[this.orbit.length-1].select = function () {};
        this.orbit[this.orbit.length-1].unselect = function () {};
        // Fit the scale of the Connector to the scale of this object.
        this.orbit[this.orbit.length-1].scale[0] = this.scale[0] / 10;
        this.orbit[this.orbit.length-1].scale[2] = this.scale[0] / 10;
        // Remove the reference to the placeholder-objects.
        this.orbit[this.orbit.length-1].obj1 = null
        this.orbit[this.orbit.length-1].obj2 = null;
        // Do the same for the rest of the placeholder-objects.
        for (let i = 1; i < length; i++) {
            this.orbit.push(new Connector(
                this.orbit[i],
                this.orbit[i-1],
                0,
                [1, 1, 1],
                1
            ));
            this.orbit[this.orbit.length-1].select = function () {};
            this.orbit[this.orbit.length-1].unselect = function () {};
            this.orbit[this.orbit.length-1].scale[0] = this.scale[0] / 10;
            this.orbit[this.orbit.length-1].scale[2] = this.scale[0] / 10;
            this.orbit[this.orbit.length-1].obj1 = null
            this.orbit[this.orbit.length-1].obj2 = null;
        }
        // Remove the placeholder-objects from the list of orbit-objects.
        this.orbit.splice(0, length);
    }

    /**
     * Use this method to add a new object that orbits around this object.
     * The object will be added to the list of objects (this.objects) 
     * that orbit this OrbitingObject.
     * @param {!Model} model - the model of the new object
     * @param {?HTMLImageElement} texture - two-dimensional texture to 
     *      be used on the model | null if no texture should be used
     * @param {![number, number, number]} relativePosition - xyz coordinates 
     *      relative to this object
     * @param {![number, number, number]} scale - scaling of the model 
     *      in xyz directions
     * @param {!Material} material - material used for shading the new object
     * @param {![number, number, number]} ambColor - ambient color of the new 
     *      object in rgb [0,1]
     * @param {![number, number, number]} difColor - diffuse color of the new
     *      object in rgb [0,1]
     * @param {!number} alpha - alpha value of the color of the new object
     * @param {![number, number, number]} rotObject - angular momentum 
     *      around x,y,z-axis in object-space
     * @param {![number, number, number]} rotRoot - rotation of the orbit
     *      around x,y,z-axis in root-object-space (in dec)
     * @param {!number} rotSpeed - speed at which the new object 
     *      rotates around itself 
     * @param {!number} orbitSpeed - speed at which the new object
     *      orbits around this object
     * @returns {OrbitingObject} the method returns the new object
     */
    addObject(
        model, texture, relativePosition, scale,
        material, ambColor, difColor, alpha, 
        rotObject, rotRoot, rotSpeed, orbitSpeed
    ) {
        this.objects.push(new OrbitingObject(
            model,
            texture,
            this,             // Set this object as the root of the new object.
            relativePosition,
            scale,
            material,
            ambColor,
            difColor,
            this.speColor,    // Use the same specular color for the object.
            alpha,
            rotObject,
            rotRoot,
            rotSpeed,
            orbitSpeed
        ));
        return this.objects[this.objects.length-1];
    }

    /**
     * Use this method to update the position of this object and the objects,
     * orbiting this object.
     * @param {!number} time - time for which the objects are to be updated
     * @param {!number} speed - multiplier for the movement speed
     */
    update(time, speed) {
        // Radius.
        const r = vec3.length(this.position);
        // Angular velocity.
        const w = r == 0? 
            0 : (1 / 200) * (speed * this.orbitSpeed * Math.PI / r);
        // Get the current angle of the position on the orbit.
        let phi = Math.atan2(
            this.position[0], 
            this.position[2]
        );
        // Calculate the new angle on the orbit and set the new position.
        phi = (phi + time * w) % (2 * Math.PI);
        this.position = vec3.fromValues(
            r * Math.sin(phi),
            0,
            r * Math.cos(phi)
        );
        // Update the rotation of this object around itself.
        quat.rotateX(
            this.rotationObject, 
            this.rotationObject, 
            (1 / 2000) * speed * this.rotSpeed * time * this.rotObject[0]
        );
        quat.rotateY(
            this.rotationObject, 
            this.rotationObject, 
            (1 / 2000) * speed * this.rotSpeed * time * this.rotObject[1]
        );
        quat.rotateZ(
            this.rotationObject, 
            this.rotationObject, 
            (1 / 2000) * speed * this.rotSpeed * time * this.rotObject[2]
        );

        // If this.orbit is a array, this object uses a dynamic orbit or 
        // no orbit at all. Else there is a static orbit.
        // Each case needs different handling.
        if (Array.isArray(this.orbit)) {
            const help = vec3.create();
            // Get the distance the root-object traveled since the orbit 
            // position was last updated.
            vec3.sub(help, this.getRootPosition(), this.orbitOrigin);
            // Every Connector-object of the dynamic orbit needs to be updated 
            // according to the distance. If there is no orbit used, the length 
            // is 0 and this will do nothing.
            for (let i = 0; i < this.orbit.length; i++) {
                vec3.add(
                    this.orbit[i].position, 
                    this.orbit[i].position, 
                    help
                );
            }
        } else {
            // If there is a StaticOrbit, it is simple to update the position.
            this.orbit.position = this.getRootPosition();
        }
        // Update this.orbitOrigin for the next update()-call.
        this.orbitOrigin = this.getRootPosition();
        // Update all the objects that orbit around this object.
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].update(time, speed);
        }
    }

    /**
     * Use this method to get a list of all the objects that orbit 
     * around this object. The list is split into a list of objects 
     * and a list of orbits. This method works recursively to also get 
     * the objects orbiting other orbiting objects and orbits.
     * @returns {[OrbitingObject[], CelestialBody[]]} returns the two lists
     *      (the orbits will be either of class Connector in the case of 
     *      dynamic orbits or StaticOrbit)
     */
    getObjects() {
        let objs = [[],[]];
        // This gets all the objects that build the orbit.
        // If a dynamic orbit is used or if there is no orbit, copy the array 
        // of needed objects. Else, push the StaticOrbit-object to the 
        // objs-array.
        if (Array.isArray(this.orbit)) {
            objs[1] = objs[1].concat(this.orbit); // Dynamic or no orbit.
        } else {
            objs[1].push(this.orbit); // Static orbit.
        }
        // Get all the objects that orbit around this object.
        // This also includes all subobjects of these objects as well (for
        // example orbits of orbiting objects).
        let indirectObjs = [];
        for (let i = 0; i < this.objects.length; i++) {
            indirectObjs = this.objects[i].getObjects();
            objs[0] = objs[0]
                .concat([this.objects[i]])
                .concat(indirectObjs[0]);
            objs[1] = objs[1].concat(indirectObjs[1]);
        }
        return objs;
    }

    /**
     * @override
     * Use this method to get both the world-matrix 
     * and the matrix to transform normals.
     * @returns {[glMatrix.mat4, glMatrix.mat4]} 
     *      returns both matrices in one array
     */
    getWorldMats() {
        const worldMat = mat4.create();
        const normalWorldMat = mat4.create();
        const rotMat = mat4.create();
        const rootPos = this.getRootPosition();
        const truePos = vec3.add(vec3.create(), rootPos, this.position);
        // Matrix to rotate the object in object-space, change the position 
        // and scale it to the correct size.
        mat4.fromRotationTranslationScale(
            worldMat,
            this.rotationObject, 
            truePos, 
            this.scale,
        );
        // Matrix to rotate the object in root-object-space.
        mat4.fromRotationTranslationScaleOrigin(
            rotMat, 
            this.rotationRoot,
            vec3.create(),
            vec3.fromValues(1,1,1),
            rootPos
        );
        // Multiply both matrices.
        mat4.multiply(worldMat, rotMat, worldMat);
        // Compute the Matrix for the normals.
        mat4.invert(normalWorldMat, worldMat);
        mat4.transpose(normalWorldMat, normalWorldMat);
        // Return both.
        return[worldMat, normalWorldMat];
    }

    /**
     * Call this method when this body is selected.
     * The method sets the UI-infotext to display basic 
     * information about this body (position and scale).
     */
    select() {
        // Compute the true position of the object.

        // Add the position of the root object to this position.
        const rootPos = this.getRootPosition();
        const truePos = vec3.add(vec3.create(), rootPos, this.position);
        
        // Rotate the position around the root object.
        const truePos4 = vec4.fromValues(
            truePos[0], 
            truePos[1], 
            truePos[2],
            1
        );
        const mat = mat4.create();
        mat4.fromRotationTranslationScaleOrigin(
            mat, 
            this.rotationRoot,
            vec3.create(),
            vec3.fromValues(1,1,1),
            rootPos
        );
        vec4.transformMat4(truePos4, truePos4, mat);

        // Get the true position from the homogeneous coordinates.
        vec3.set(
            truePos,
            truePos4[0] / truePos4[3],
            truePos4[1] / truePos4[3],
            truePos4[2] / truePos4[3]
        );

        // Display the true position.
        setInfoText(
            "position: [" + Math.round(truePos[0]) +
            ", " + Math.round(truePos[1]) +
            ", " + Math.round(truePos[2]) + "]\r\n" +
            "scale: [" + Math.round(this.scale[0]) +
            ", " + Math.round(this.scale[1]) +
            ", " + Math.round(this.scale[2]) + "]"
        );
    }
}

/**
 * A class to represent stars in the background. This class should be used 
 * for the gaia data. This class uses a special model of a 2D circle to save
 * memory and lower computational cost. The circle is rotated to always face 
 * the camera. BackgroundStars only use ambient colors and are not uses as 
 * light sources. BackgroundStars need a index to identify the object.
 * @extends CelestialBody
 */
class BackgroundStar extends CelestialBody {
    /**
     * @constructor
     * @param {!Camera} cam - the camera of the scene
     * @param {![number, number, number]} position - position in 
     *      world-xyz-coordinates
     * @param {![number, number, number]} scale - scaling of the model
     * @param {![number, number, number]} color - color in rgb [0,1]
     * @param {!number} alpha - alpha value of the color of this object
     * @param {!number} index - index to identify this object
     */
    constructor(
        cam, position, scale, 
        color, alpha, index
    ) {
        super(
            getModel('circle'), // 2D circle.
            null,               // No texture is used.
            position, 
            scale, 
            basicMaterials.amb, 
            color, 
            color, 
            color,
            alpha,
            index
        );
        // The Camera-object is required to rotate the circle in the 
        // direction of the camera.
        this.cam = cam;
    }

    /**
     * @override
     * Use this method to get both the world-matrix 
     * and the matrix to transform normals.
     * @returns {[glMatrix.mat4, glMatrix.mat4]} 
     *      returns both matrices in one array
     */
    getWorldMats() {
        const worldMat = mat4.create();
        const normalWorldMat = mat4.create();
        // Calculate the axis and angle needed for rotation, 
        // such that this object faces the camera. 
        const posToView = vec3.create();
        vec3.sub(posToView, this.position, this.cam.position);
        const rotateAxis = vec3.create();
        vec3.cross(rotateAxis, vec3.fromValues(0,1,0), posToView);
        const angle = vec3.angle(vec3.fromValues(0,1,0), posToView);
        // Translate the position of the BackgroundStar.
        mat4.translate(worldMat, worldMat, this.position);
        // Rotate it with the calculated axis and angle
        mat4.rotate(worldMat, worldMat, angle, rotateAxis);
        // Scale the object.
        mat4.scale(worldMat, worldMat, this.scale);
        // Get the matrix for the normals.
        mat4.invert(normalWorldMat, worldMat);
        mat4.transpose(normalWorldMat, normalWorldMat);
        // Return both.
        return[worldMat, normalWorldMat];
    }

    /**
     * @override
     * Add information about this BackgroundStar. Add instructions for 
     * connecting two BackgroundStars.
     * Also change the scaling for a better Visualization of the selection.
     */
    select() {
        super.select();
        setInfoText(
            "STAR\r\n" + 
            getInfoText() + 
            "\r\nmiddle mouse button on 2 stars to connect them "
        );
        vec3.scale(this.scale, this.scale, 4);
    }

    /**
     * @override
     * Change the scaling back to normal.
     */
    unselect() {
        super.unselect();
        vec3.scale(this.scale, this.scale, 1/4);
    }

    /**
     * @override
     * Add a Connector, if the mouse-wheel is clicked 
     * while this Object is selected.
     * @param {!Event.button} button - mouse button pressed
     */
    click(button) {
        if (button == 1) {
            // The function addConnector() is defined in scene.js.
            addConnector(this.index, getColor(), false);
        }
    }

    /**
     * @override
     * Swap the solar system to this object, if the Key P is 
     * pressed while this object is selected.
     * @param {!Event.code} code - key-code of the pressed key
     */
    keyClick(code) {
        if (code == "KeyP") {
            // The function swapStar() is defined in scene.js.
            swapStar(this.index);
        }
    }
}

/**
 * A class to represent Connections between two CelestialBody-objects.
 * This class was intended for the visualization of star sign connections, 
 * but is also used for the dynamic generation of orbits for OrbitingObjects.
 * Connector-objects only use ambient colors.
 * @extends CelestialBody
 */
class Connector extends CelestialBody {
    /**
     * @constructor
     * @param {!CelestialBody} obj1 - first object to be connected
     * @param {!CelestialBody} obj2 - first object to be connected
     * @param {!number} inset - inset at the ends of the connector 
     *      (length of the connector = |obj1.pos - obj2.pos| - 2 * inset)
     * @param {![number, number, number]} color - color in rgb [0,1]
     * @param {!number} alpha - alpha value of the color of this connector
     */
    constructor(obj1, obj2, inset, color, alpha) {
        super(
            getModel('cylinder'),   // Uses a cylinder, 
                                    // which gets scaled to the needed length.
            null,                   // Uses no texture.
            [0,0,0],                // Position is set after the super.
            [2,0,2],              // Length (y-scale) is set after the super.
            basicMaterials.amb, 
            color, 
            color, 
            color,
            alpha,
        );
        this.inset = inset;
        this.obj1 = obj1;
        this.obj2 = obj2;
        // The connector is positioned in the middle between the two objects.
        vec3.sub(this.position, this.obj1.position, this.obj2.position);
        // Save the length for scaling.
        this.length = vec3.length(this.position) ;
        vec3.scale(this.position, this.position, 0.5);
        vec3.add(this.position, this.position, this.obj2.position);
        // Scale the length of the connector.
        this.scale[1] = this.length - this.inset;
        // Vector from the position to obj1.
        const posToObj = vec3.create();
        // Calculate rotation axis and angle, so the connector is lined up
        // between the two objects.
        vec3.sub(posToObj, this.position, this.obj1.position);
        this.rotAxis = vec3.create();
        vec3.cross(this.rotAxis, vec3.fromValues(0,1,0), posToObj);
        this.angle = vec3.angle(vec3.fromValues(0,1,0), posToObj);
    }

    /**
     * @override
     * Use this method to get both the world-matrix 
     * and the matrix to transform normals.
     * @returns {[glMatrix.mat4, glMatrix.mat4]} 
     *      returns both matrices in one array
     */
    getWorldMats() {
        const worldMat = mat4.create();
        const normalWorldMat = mat4.create();
        // Translate the connector to its position.
        mat4.translate(worldMat, worldMat, this.position);
        // Rotate the connector, so it lines up with the connected objects.
        mat4.rotate(worldMat, worldMat, this.angle, this.rotAxis);
        // Scale it to the needed length.
        mat4.scale(worldMat, worldMat, this.scale);
        // Get the normal-matrix.
        mat4.invert(normalWorldMat, worldMat);
        mat4.transpose(normalWorldMat, normalWorldMat);
        // Return both.
        return[worldMat, normalWorldMat];
    }

    /**
     * @override
     * Add information about the connector. Also add instructions about
     * how to delete the connector. Also change the scaling for a better
     * Visualization of the selection.
     */
    select() {
        setInfoText(
            "CONNECTOR\r\nlength: " + 
            Math.round(this.length) + 
            "\r\np to delete the connector"
        );
        vec3.scale(this.scale, this.scale, 4);
        this.scale[1] /= 4;
    }

    /**
     * @override
     * Change the scaling back to normal.
     */
    unselect() {
        super.unselect();
        vec3.scale(this.scale, this.scale, 1/4);
        this.scale[1] *= 4;
    }
    
    /**
     * @override
     * Delete this connection if the key P is pressed while it is selected.
     * @param {!Event.code} code - key-code of the pressed key.
     */
    keyClick(code) {
        if (code == "KeyP") {
            // The function removeConnector is defined in scene.js.
            removeConnector(this);
        }
    }
}

/**
 * A class for easy visualization of orbits.
 * This is a CelestialBody with a special orbit-model.
 * @extends CelestialBody
 */
class StaticOrbit extends CelestialBody {
    /**
     * @constructor
     * @param {!OrbitingObject} object - the object with this orbit
     */
    constructor(object) {
        super(
            getModel('orbit'),                  // The special model.
            null,                               // Orbits have no texture.
            object.getRootPosition(),           // Origin of the orbit.
            [
                vec3.length(object.position),
                vec3.length(object.position),
                vec3.length(object.position)
            ], 
            basicMaterials.amb,
            [1,1,1],
            [1,1,1],
            [1,1,1],
            1
        );
        this.object = object;
        this.rotationRoot = this.object.rotationRoot;
    }

    /**
     * @override
     * Use this method to get both the world-matrix 
     * and the matrix to transform normals.
     * @returns {[glMatrix.mat4, glMatrix.mat4]} 
     *      returns both matrices in one array
     */
    getWorldMats() {
        const worldMat = mat4.create();
        const normalWorldMat = mat4.create();
        // Rotate the orbit. Place the orbit at its origin and scale 
        // it to the needed size.
        mat4.fromRotationTranslationScale(
            worldMat,
            this.rotationRoot, 
            this.position, 
            this.scale,
        );
        // Get normal-matrix.
        mat4.invert(normalWorldMat, worldMat);
        mat4.transpose(normalWorldMat, normalWorldMat);
        // Return both.
        return[worldMat, normalWorldMat];
    }

    /**
     * @override
     * StaticOrbit-objects are not selectable, so this does nothing.
     */
    select() {}

    /**
     * @override
     * StaticOrbit-objects are not selectable, 
     * so they also can not be unselected. This does nothing.
     */
    unselect() {}
}