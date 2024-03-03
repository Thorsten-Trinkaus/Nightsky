/**
 * 
 */
class CelestialBody {
    /**
     * @param {!WebGLRenderingContext} gl - webGl rendering context
     * @param {!Model} model - the model of the object
     * @param {?HTMLImageElement} texture - texture to be used on the model
     * @param {![number,number,number]} position - xyz coordinates
     * @param {![number,number,number]} scale - scaling of the model 
     *      in xyz directions
     * @param {!Material} material - material used for shading the object  
     * @param {![number,number,number]} ambColor - ambient color of the object 
     *      in rgb [0,1]
     * @param {![number,number,number]} difColor - diffuse color of the object 
     *      in rgb [0,1]
     * @param {![number,number,number]} speColor - specular color of the object 
     *      in rgb [0,1]
     * @param {!number} brightness - brightness between 0 and 1
     * @param {!number} rotX - rotation around the x-axis in object 
     *      coordinates, measured in radians
     * @param {!number} rotY - rotation around the y-axis in object 
     *      coordinates, measured in radians
     * @param {!number} rotZ - rotation around the z-axis in object 
     *      coordinates, measured in radians
     */
    constructor(
        model, texture, position, scale, 
        material, ambColor, difColor, speColor,
        brightness, rotXWorld, rotYWorld, rotZWorld,
        rotXObject, rotYObject, rotZObject
    ) {
        this.model = model;
        this.texture = null;
        if (texture != null) {
            const gl = getGLContext();
            this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(
                gl.TEXTURE_2D, 
                0, 
                gl.RGBA, 
                gl.RGBA, 
                gl.UNSIGNED_BYTE, 
                texture
            );
            gl.texParameteri(
                gl.TEXTURE_2D, 
                gl.TEXTURE_MIN_FILTER, 
                gl.LINEAR
            );
            gl.texParameteri(
                gl.TEXTURE_2D, 
                gl.TEXTURE_MAG_FILTER, 
                gl.LINEAR
            );
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
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
        this.position = vec3.clone(position);
        this.scale = scale;
        this.material = material;
        this.ambColor = ambColor;
        this.difColor = difColor;
        this.speColor = speColor;
        this.brightness = brightness;
        this.rotationWorld = quat.create();
        quat.fromEuler(this.rotationWorld, rotXWorld, rotYWorld, rotZWorld);
        this.rotationObject = quat.create();
        quat.fromEuler(this.rotationObject, rotXObject, rotYObject, rotZObject);
    }

    /**
     * changing or removing the texture of the object
     * @param {?HTMLImageElement} texture - new texture |
     *  null removes the current texture
     */
    updateTexture(texture) {
        const gl = getGLContext();
        // removing the current texture
        if (texture == null) {
            this.texture = null;
            return;
        }
        // if there was no texture before this creates a new WebGL texture
        if (this.texture == null) {
            this.texture = gl.createTexture();
        }
        // binds new texture
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(
            gl.TEXTURE_2D, 
            0, 
            gl.RGBA,
            gl.RGBA, 
            gl.UNSIGNED_BYTE, 
            texture
        );
        // setting the WebGL texture parameter for the new texture
        gl.texParameteri(
            gl.TEXTURE_2D, 
            gl.TEXTURE_MIN_FILTER, 
            gl.LINEAR
        );
        gl.texParameteri(
            gl.TEXTURE_2D, 
            gl.TEXTURE_MAG_FILTER, 
            gl.LINEAR
        );
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
        //unbinding the texture
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * Get the world matrix and the world matrix that transforms the normals.
     * @returns {[mat4,mat4]} Returns both matrices.
     */
    getWorldMats() {
        let worldMat = mat4.create();
        let normalWorldMat = mat4.create();
        mat4.fromRotationTranslationScale(
            worldMat,
            this.rotationObject, 
            this.position, 
            this.scale,
        );
        let rotMat = mat4.create();
        mat4.fromRotationTranslationScaleOrigin(
            rotMat, 
            this.rotationWorld, 
            vec3.create(),
            vec3.fromValues(1, 1, 1),
            vec3.fromValues(0, 0, 0)
        );
        mat4.multiply(worldMat, rotMat, worldMat);
        mat4.invert(normalWorldMat, worldMat);
        mat4.transpose(normalWorldMat, normalWorldMat);
        return[worldMat, normalWorldMat];
    }

    select() {
        setInfoText(
            "position: [" + Math.round(this.position[0]) +
            ", " + Math.round(this.position[1]) +
            ", " + Math.round(this.position[2]) + "]\r\nscale: " + 
            "[" + Math.round(this.scale[0]) +
            ", " + Math.round(this.scale[1]) +
            ", " + Math.round(this.scale[2]) + "]"
        );
    }

    unselect() {
        setInfoText("nothing selected");
    }

    click(button) {}

    keyClick(code) {}
}

//very likly to be broken

/* class CelestialBodyPhysics extends CelestialBody {
    constructor(gl, model, position, scale, material, colors, velocity, mass) {
        super(gl, model, position, scale, material, colors, 0, 0, 0);
        this.velocity = velocity;
        this.mass = mass;
        this.G = 6.67430e-11;
    }
    addObject(model, position, scale, material, colors, velocity, mass) {
        var truePosition = [
            this.position[0] + position[0],
            this.position[1] + position[1],
            this.position[2] + position[2]
        ];
        this.objects.push(new CelestialBodyPhysics(
            getGLContext(), 
            model,
            truePosition,
            scale,
            material,
            colors,
            velocity, 
            mass
        ));
        this.objects[this.objects.length - 1].root = this;
    }
    calcVelocity(obj1, time) {
        var acceleration = vec3.create();
        this.objects.forEach(obj2 => {
            if (obj1 != obj2) {
                var forceDirection = vec3.create();
                vec3.sub(forceDirection, obj2.position, obj1.position);
                var sqrDistance =
                    forceDirection[0]*forceDirection[0] +
                    forceDirection[1]*forceDirection[1] +
                    forceDirection[2]*forceDirection[2];
                vec3.normalize(forceDirection, forceDirection);
                var force = vec3.create();
                vec3.scale(
                    force, 
                    forceDirection, 
                    (this.G * obj2.mass) / sqrDistance
                );
                vec3.add(acceleration, acceleration, force);
            }
        });
        vec3.scale(acceleration, acceleration, time);
        vec3.add(obj1.velocity, obj1.velocity, acceleration);
        obj1.update(time, 1);
    }
    calcPosition(obj, time) {
        var vel = vec3.create();
        vec3.scale(vel, obj.velocity, time);
        obj.objects.forEach(object => {
            vec3.add(object.position, object.position, vel);
        });
    }
    update(time, steps) {
        for (var i = 0; i < steps; i++) {
            for(var j = 1; j < this.objects.length; j++) {
                this.calcVelocity(this.objects[j], time);
            }
            for(var j = 1; j < this.objects.length; j++) {
                this.calcPosition(this.objects[j], time);
            }
        }
    }
} */

class Star extends CelestialBody {
    constructor(
        index, model, texture, 
        scale, material, ambColor,
        difColor, speColor, brightness
    ) {
        super(
            model, 
            texture, 
            [0,0,0], 
            scale, 
            material, 
            ambColor,
            difColor,
            speColor,
            brightness, 
            0, 0, 0,
            0, 0, 0
        );
        this.cams = [
            new Camera(
                [0, 0, 0],
                vec3.fromValues(1, 0, 0),
                vec3.fromValues(0, -1, 0),
                Math.PI / 2
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
        this.index = index;
        this.objects = [];
    }

    select() {
        super.select();
        setInfoText("STAR\r\n" + getInfoText());
    }

    addObject(
        model, texture, relativePosition, scale,
        material, ambColor, difColor, speColor, 
        brightness, rotXWorld, rotYWorld, rotZWorld,
        rotXObject, rotYObject, rotZObject
    ) {
        this.objects.push(new OrbitingObjects(
            model,
            texture,
            this,
            relativePosition,
            scale,
            material,
            ambColor,
            difColor,
            speColor,
            brightness,
            rotXWorld,
            rotYWorld,
            rotZWorld,
            rotXObject,
            rotYObject,
            rotZObject
        ));
        return this.objects[this.objects.length-1];
    }

    getObjectsToRender() {
        let objs = [[this],[]];
        let subObjs;
        for (let i = 0; i < this.objects.length; i++) {
            subObjs = this.objects[i].getObjectsToRender();
            objs[0] = objs[0].concat(subObjs[0]);
            objs[1] = objs[1].concat(subObjs[1]);
        }
        return objs;
    }

    update(time, speed) {
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].update(time, speed);
        }
    }
}

//very likly to be broken

// class StarPhysics extends CelestialBodyPhysics {
//     constructor(gl, model, scale, material, colors, mass) {
//         super(gl, model, [0,0,0], scale, material, colors, [0,0,0], mass, 0, 0, 0);
//         this.cams = [
//             new Camera(
//                 this.position,
//                 vec3.add(vec3.create(), this.position, vec3.fromValues(1,0,0)),
//                 vec3.fromValues(0,-1,0)
//             ),
//             new Camera(
//                 this.position,
//                 vec3.add(vec3.create(), this.position, vec3.fromValues(-1,0,0)),
//                 vec3.fromValues(0,-1,0)
//             ),
//             new Camera(
//                 this.position,
//                 vec3.add(vec3.create(), this.position, vec3.fromValues(0,1,0)),
//                 vec3.fromValues(0,0,1)
//             ),
//             new Camera(
//                 this.position,
//                 vec3.add(vec3.create(), this.position, vec3.fromValues(0,-1,0)),
//                 vec3.fromValues(0,0,-1)
//             ),
//             new Camera(
//                 this.position,
//                 vec3.add(vec3.create(), this.position, vec3.fromValues(0,0,1)),
//                 vec3.fromValues(0,-1,0)
//             ),
//             new Camera(
//                 this.position,
//                 vec3.add(vec3.create(), this.position, vec3.fromValues(0,0,-1)),
//                 vec3.fromValues(0,-1,0)
//             ),
//         ];
//     }
// }

class OrbitingObjects extends CelestialBody {
    constructor(
        model, texture, root, relativePosition, scale, 
        material, ambColor, difColor, speColor,
        brightness, rotXWorld, rotYWorld, rotZWorld,
        rotXObject, rotYObject, rotZObject
    ) {
        super(
            model, 
            texture, 
            relativePosition, 
            scale, 
            material, 
            ambColor, 
            difColor, 
            speColor,
            brightness, 
            rotXWorld,
            rotYWorld,
            rotZWorld,
            rotXObject,
            rotYObject,
            rotZObject
        );
        this.root = root;
        this.objects = [];
        this.relativePosition = relativePosition;
        vec3.add(this.position, this.relativePosition, this.root.position);
        this.orbit = [];
        this.orbitOrigin = vec3.clone(this.root.position);
    }

    addStaticOrbit() {
        this.orbit = new StaticOrbit(this);
    }

    addDynamicOrbit() {
        this.orbit = [];
        const r = vec3.length(this.relativePosition);
        let pos;
        let pos4;
        for (let phi = 0; phi < 2 * Math.PI; phi += Math.PI / 50) {
            pos = vec3.fromValues(
                r * Math.sin(phi),
                0,
                r * Math.cos(phi),
            );
            pos4 = vec4.fromValues(pos[0],pos[1],pos[2],1);
            vec4.transformQuat(pos4, pos4, this.rotationWorld);
            pos = vec3.fromValues(
                pos4[0] / pos4[3],
                pos4[1] / pos4[3],
                pos4[2] / pos4[3]
            );
            vec3.add(pos, pos, this.orbitOrigin);
            this.orbit.push(new CelestialBody(
                getModel('circle'), 
                null, 
                vec3.clone(pos), 
                [1, 1, 1], 
                basicMaterials.amb, 
                [0, 0, 0], 
                [0, 0, 0], 
                [0, 0, 0], 
                1, 
                0, 0, 0,
                0, 0, 0
            ));
        }
        const length = this.orbit.length;
        this.orbit.push(new Connector(
            this.orbit[0],
            this.orbit[this.orbit.length-1],
            0,
            [1, 1, 1],
            1
        ));
        this.orbit[this.orbit.length-1].select = function () {};
        this.orbit[this.orbit.length-1].unselect = function () {};
        this.orbit[this.orbit.length-1].scale[0] = this.scale[0] / 10;
        this.orbit[this.orbit.length-1].scale[2] = this.scale[0] / 10;
        this.orbit[this.orbit.length-1].star1 = null
        this.orbit[this.orbit.length-1].star2 = null;
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
            this.orbit[this.orbit.length-1].star1 = null
            this.orbit[this.orbit.length-1].star2 = null;
        }
        this.orbit.splice(0, length);
    }

    addObject(
        model, texture, relativePosition, scale, 
        material, ambColor, difColor, speColor, 
        brightness, rotXWorld,rotYWorld, rotZWorld, 
        rotXObject, rotYObject, rotZObject
    ) {
        this.objects.push(new OrbitingObjects(
            model, 
            texture, 
            this, 
            relativePosition, 
            scale, 
            material,
            ambColor,
            difColor,
            speColor,
            brightness,
            rotXWorld,
            rotYWorld,
            rotZWorld,
            rotXObject,
            rotYObject,
            rotZObject
        ));
        return this.objects[this.objects.length-1];
    }

    update(time, speed) {

        const r = vec3.length(this.relativePosition);
        const w = r == 0? 0 : (speed * Math.PI) / (200 * r);
        let phi = Math.atan2(
            this.relativePosition[0], 
            this.relativePosition[2]
        );
        phi = (phi + time * w) % (2 * Math.PI);
        quat.rotateY(this.rotationObject, this.rotationObject, phi / 100);
        this.relativePosition = vec3.fromValues(
            r * Math.sin(phi),
            0,
            r * Math.cos(phi)
        );
        vec3.add(
            this.position,
            this.relativePosition,
            this.root.position
        );
        let pos4 = vec4.fromValues(
            this.position[0], 
            this.position[1], 
            this.position[2], 
            1
        );
        let rotMat = mat4.create();
        mat4.fromRotationTranslationScaleOrigin(
            rotMat, 
            this.rotationWorld, 
            vec3.create(),
            vec3.fromValues(1, 1, 1),
            this.root.position
        );
        vec4.transformMat4(pos4,pos4,rotMat);
        this.position= vec3.fromValues(
            pos4[0] / pos4[3], 
            pos4[1] / pos4[3], 
            pos4[2] / pos4[3]
        );
        if (Array.isArray(this.orbit)) {
            const help = vec3.create();
            vec3.sub(help, this.root.position, this.orbitOrigin);
            for (let i = 0; i < this.orbit.length; i++) {
                vec3.add(
                    this.orbit[i].position, 
                    this.orbit[i].position, 
                    help
                );
                vec3.add(
                    this.orbit[i].pos1, 
                    this.orbit[i].pos1, 
                    help
                );
            }
        } else {
            this.orbit.position = vec3.clone(this.root.position);
        }
        this.orbitOrigin = vec3.clone(this.root.position);
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].update(time, speed);
        }
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].update(time, speed);
        }
    }

    getObjectsToRender() {
        const objs = [[this],[]];
        if (Array.isArray(this.orbit)) {
            objs[1] = [].concat(this.orbit);
        } else {
            objs[1].push(this.orbit);
        }
        let subObjs;
        for (let i = 0; i < this.objects.length; i++) {
            subObjs = this.objects[i].getObjectsToRender();
            objs[0] = objs[0].concat(subObjs[0]);
            objs[1] = objs[1].concat(subObjs[1]);
        }
        return objs;
    }

    getWorldMats() {
        let worldMat = mat4.create();
        let normalWorldMat = mat4.create();
        mat4.fromRotationTranslationScale(
            worldMat,
            this.rotationObject, 
            this.position, 
            this.scale,
        );
        mat4.invert(normalWorldMat, worldMat);
        mat4.transpose(normalWorldMat, normalWorldMat);
        return[worldMat, normalWorldMat];
    }
}

class BackgroundStar extends CelestialBody {
    constructor(
        index, cam, model, texture, position, 
        scale, material, ambColor, difColor, 
        speColor, brightness
    ) {
        super(
            model, 
            texture, 
            position, 
            scale, 
            material, 
            ambColor, 
            difColor, 
            speColor,
            brightness, 
            0, 0, 0, 
            0, 0, 0
        );
        this.index = index;
        this.cam = cam;
    }
    getWorldMats() {
        let posToView = vec3.create();
        vec3.sub(posToView, this.position, this.cam.position);
        let rotateAxis = vec3.create();
        vec3.cross(rotateAxis, vec3.fromValues(0,1,0), posToView);
        let angle = vec3.angle(vec3.fromValues(0,1,0), posToView);
        let worldMat = mat4.create();
        let normalWorldMat = mat4.create();
        mat4.translate(worldMat, worldMat, this.position);
        mat4.rotate(worldMat, worldMat, angle, rotateAxis);
        mat4.scale(worldMat, worldMat, this.scale);
        return[worldMat, normalWorldMat];
    }
    select() {
        super.select();
        setInfoText("STAR\r\n" + 
            getInfoText() + 
            "\r\nmiddle mouse button on 2 stars to connect them"
        );
        vec3.scale(this.scale, this.scale, 4);
    }
    unselect() {
        super.unselect();
        vec3.scale(this.scale, this.scale, 1/4);
    }
    click(button) {
        if (button == 1) {
            addConnector(this.index, getColor(), false);
        }
    }
    keyClick(code) {
        if (code == "KeyP") {
            swapStar(this.index);
        }
    }
}

class Connector extends CelestialBody {
    constructor(star1, star2, inset, color, brightness) {
        let position = vec3.create();
        vec3.sub(position, star1.position, star2.position);
        const length = vec3.length(position);
        vec3.scale(position, position, 0.5);
        vec3.add(position, position, star2.position);
        super(
            getModel('cylinder'), 
            null,
            position, 
            [2, length - inset, 2], 
            basicMaterials.amb, 
            color, 
            color, 
            color,
            brightness,
            0, 0, 0,
            0, 0, 0
        );
        this.star1 = star1;
        this.star2 = star2;
        this.pos1 = vec3.clone(star1.position);
        this.length = length;
    }

    getWorldMats() {
        let posToStar = vec3.create();
        vec3.sub(posToStar, this.position, this.pos1);
        let rotateAxis = vec3.create();
        vec3.cross(rotateAxis, vec3.fromValues(0,1,0), posToStar);
        let angle = vec3.angle(vec3.fromValues(0,1,0), posToStar);
        let worldMat = mat4.create();
        let normalWorldMat = mat4.create();
        mat4.translate(worldMat, worldMat, this.position);
        mat4.rotate(worldMat, worldMat, angle, rotateAxis);
        mat4.scale(worldMat, worldMat, this.scale);
        mat4.invert(normalWorldMat, worldMat);
        mat4.transpose(normalWorldMat, normalWorldMat);
        return[worldMat, normalWorldMat];
    }

    select() {
        setInfoText("CONNECTOR\r\n" + "length: " + 
            Math.round(this.length) + "\r\np to delete the connector"
        );
        vec3.scale(this.scale, this.scale, 4);
        this.scale[1] /= 4;
    }

    unselect() {
        super.unselect();
        vec3.scale(this.scale, this.scale, 1/4);
        this.scale[1] *= 4;
    }
    
    keyClick(code) {
        if (code == "KeyP") {
            removeConnector(this);
        }
    }
}

class StaticOrbit extends CelestialBody {
    constructor(obj) {
        super(
            getModel('orbit'), 
            null,
            obj.orbitOrigin, 
            [
                vec3.length(obj.relativePosition),
                vec3.length(obj.relativePosition),
                vec3.length(obj.relativePosition)
            ], 
            basicMaterials.amb,
            [1,1,1],
            [1,1,1],
            [1,1,1],
            1,
            0, 0, 0,
            0, 0, 0
        );
        this.obj = obj;
        this.rotationWorld = this.obj.rotationWorld;
    }
    getWorldMats() {
        let worldMat = mat4.create();
        let normalWorldMat = mat4.create();
        mat4.fromRotationTranslationScale(
            worldMat,
            this.rotationObject, 
            this.position, 
            this.scale,
        );
        let rotMat = mat4.create();
        mat4.fromRotationTranslationScaleOrigin(
            rotMat, 
            this.rotationWorld, 
            vec3.create(),
            vec3.fromValues(1, 1, 1),
            this.obj.root.position
        );
        mat4.multiply(worldMat, rotMat, worldMat);
        mat4.invert(normalWorldMat, worldMat);
        mat4.transpose(normalWorldMat, normalWorldMat);
        return[worldMat, normalWorldMat];
    }
    select() {}
    unselect() {}
}