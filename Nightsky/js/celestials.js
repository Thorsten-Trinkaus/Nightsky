var models; 
var materials;
function updateModelAndMaterial(mod, mat) {
    models = mod;
    materials = mat;
}

class Material {
    constructor(kAmb, kDif, kSpe, shininess) {
        this.kAmb = kAmb;
        this.kDif = kDif;
        this.kSpe = kSpe;
        this.shininess = shininess;
    }
}

class CelestialBody {
    constructor(
        gl, 
        model, 
        texture, 
        position, 
        scale, 
        material, 
        colors, 
        rotX, 
        rotY, 
        rotZ
    ) {
        this.gl = gl;
        this.model = model;
        this.texture = null;
        if (texture != null) {
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
        this.position = position;
        this.scale = scale;
        this.material = material;
        this.ambColor = colors[0];
        this.difColor = colors[1];
        this.speColor = colors[2];
        this.brightness = colors[3];
        this.objects = [this];
        this.root = this;
        this.orbit = null;
        this.truePosition = vec3.clone(position);
        this.rotation = quat.create();
        quat.fromEuler(this.rotation, rotX, rotY, rotZ);
    }
    updateTexture(texture) {
        if (this.texture == null) {
            this.texture = gl.createTexture();
        }
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
    addObject(
        model, 
        texture, 
        position, 
        scale, 
        material,
        colors, 
        rotX, 
        rotY, 
        rotZ
    ) {
        this.objects.push(new CelestialBody(
            this.gl,
            model,
            texture,
            position,
            scale,
            material,
            colors,
            rotX, 
            rotY,
            rotZ
        ));
        this.objects[this.objects.length - 1].root = this;
        vec3.add(
            this.objects[this.objects.length - 1].truePosition,
            this.objects[this.objects.length - 1].position,
            this.truePosition
        );
        this.objects[this.objects.length - 1].orbit = new Orbit(
            this.gl,
            models.orbit,
            this.objects[this.objects.length - 1],
            materials.amb
        ) 
    }
    getWorldMats() {
        var worldMat = mat4.create();
        var normalWorldMat = mat4.create();
        mat4.fromRotationTranslationScale(
            worldMat,
            quat.create(), 
            this.truePosition, 
            this.scale,
        );
        var xxmat = mat4.create();
        mat4.fromRotationTranslationScaleOrigin(
            xxmat, 
            this.rotation, 
            vec3.create(),
            vec3.fromValues(1, 1, 1),
            this.root.truePosition
        );
        mat4.multiply(worldMat,xxmat,worldMat);
        mat4.invert(normalWorldMat, worldMat);
        mat4.transpose(normalWorldMat, normalWorldMat);
        return[worldMat, normalWorldMat];
    }
    getObjectsToRender() {
        var result = [[],[]];
        result[0].push(this);
        if (this.orbit != null) {
            result[1].push(this.orbit);
        }
        for (var i = 1; i < this.objects.length; i++) {
            result[0] = result[0].concat(
                this.objects[i].getObjectsToRender()[0]);
            result[1] = result[1].concat(
                this.objects[i].getObjectsToRender()[1]);
        }
        return result;
    }
    update(time, speed) {
        var r = vec3.length(this.position);
        //Winkelgeschwindigkeit
        var w = r == 0? 0 : (speed * Math.PI) / (200 *r); 
        var phi = Math.atan2(this.position[0], this.position[2]);
        phi = (phi + time * w) % (2 * Math.PI);
        this.position = vec3.fromValues(
            r * Math.sin(phi),
            0,
            r * Math.cos(phi)
        );
        this.truePosition = vec3.clone(this.position);

        if (this.root != null) {
            vec3.add(
                this.truePosition, 
                this.truePosition, 
                this.root.truePosition
            );
        }
        if (this.orbit != null) {
            this.orbit.truePosition = vec3.clone(this.root.truePosition);
        }
        for(var i = 1; i < this.objects.length; i++) {
            this.objects[i].update(time, speed);
        }
    }

    select() {
        setInfoText(
            "position: [" + Math.round(this.truePosition[0]) +
            ", " + Math.round(this.truePosition[1]) +
            ", " + Math.round(this.truePosition[2]) + "]\r\nscale: " + 
            "[" + Math.round(this.scale[0]) +
            ", " + Math.round(this.scale[1]) +
            ", " + Math.round(this.scale[2]) + "]");
    }
    unselect() {
        setInfoText("nothing selected");
    }
    click(button) {
        
    }
    keyClick(code) {

    }
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
            this.gl, 
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
    constructor(gl, index, model, texture, scale, material, colors) {
        super(gl, model, texture, [0,0,0], scale, material, colors, 0, 0, 0);
        this.cams = [
            new Camera(
                [0,0,0],
                vec3.fromValues(1,0,0),
                vec3.fromValues(0,-1,0),
                Math.PI/2
            ),
            new Camera(
                [0,0,0],
                vec3.fromValues(-1,0,0),
                vec3.fromValues(0,-1,0),
                Math.PI/2
            ),
            new Camera(
                [0,0,0],
                vec3.fromValues(0,1,0),
                vec3.fromValues(0,0,1),
                Math.PI/2
            ),
            new Camera(
                [0,0,0],
                vec3.fromValues(0,-1,0),
                vec3.fromValues(0,0,-1),
                Math.PI/2
            ),
            new Camera(
                [0,0,0],
                vec3.fromValues(0,0,1),
                vec3.fromValues(0,-1,0),
                Math.PI/2
            ),
            new Camera(
                [0,0,0],
                vec3.fromValues(0,0,-1),
                vec3.fromValues(0,-1,0),
                Math.PI/2
            ),
        ];
        this.index = index;
    }
    select() {
        super.select();
        setInfoText("STAR\r\n" + getInfoText());
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

class BackgroundStar extends CelestialBody {
    constructor(
        gl, 
        index, 
        cam, 
        model, 
        texture,
        position, 
        scale, 
        material, 
        colors
    ) {
        super(gl, model, texture, position, scale, material, colors, 0, 0, 0);
        this.index = index;
        this.cam = cam;
    }
    getWorldMats() {
        var posToView = vec3.create();
        vec3.sub(posToView, this.position, this.cam.position);
        var rotateAxis = vec3.create();
        vec3.cross(rotateAxis, vec3.fromValues(0,1,0), posToView);
        var angle = vec3.angle(vec3.fromValues(0,1,0), posToView);
        var worldMat = mat4.create();
        var normalWorldMat = mat4.create();
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
            addConnector(this.index);
        }
    }
    keyClick(code) {
        if (code == "KeyP") {
            swapStar(this.index);
        }
    }
}

class Connector extends CelestialBody {
    constructor(gl, model, star1, star2, material) {
        var pos = vec3.create();
        vec3.sub(pos, star1.position, star2.position);
        var length = vec3.length(pos);
        vec3.scale(pos, pos, 0.5);
        vec3.add(pos, pos, star2.position);
        super(
            gl, 
            model, 
            null,
            pos, 
            [2, length-15, 2], 
            material, 
            [[211/255,89/255,68/255], [1,1,1], [1,1,1],1],
            0, 0, 0
        );
        this.star1 = star1;
        this.star2 = star2;
    }
    getWorldMats() {
        var posToStar = vec3.create();
        vec3.sub(posToStar, this.position, this.star1.position);
        var rotateAxis = vec3.create();
        vec3.cross(rotateAxis, vec3.fromValues(0,1,0), posToStar);
        var angle = vec3.angle(vec3.fromValues(0,1,0), posToStar);
        var worldMat = mat4.create();
        var normalWorldMat = mat4.create();
        mat4.translate(worldMat, worldMat, this.position);
        mat4.rotate(worldMat, worldMat, angle, rotateAxis);
        mat4.scale(worldMat, worldMat, this.scale);
        mat4.invert(normalWorldMat, worldMat);
        mat4.transpose(normalWorldMat, normalWorldMat);
        return[worldMat, normalWorldMat];
    }
    select() {
        var length = vec3.create();
        vec3.sub(length, this.star1.truePosition, this.star2.truePosition);
        length = vec3.length(length);
        setInfoText("CONNECTOR\r\n" + "star 1: " + 
            "["+Math.round(this.star1.truePosition[0]) +
            ", " + Math.round(this.star1.truePosition[1]) +
            ", " + Math.round(this.star1.truePosition[2]) + "]\r\nstar 2: " +
            "[" + Math.round(this.star2.truePosition[0]) +
            ", " + Math.round(this.star2.truePosition[1]) +
            ", " + Math.round(this.star2.truePosition[2]) + "]\r\nlength: " + 
            Math.round(length) + "\r\np to delete the connector"
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

class Orbit extends CelestialBody {
    constructor(gl, model, obj, material) {
        super(
            gl, 
            model, 
            null,
            obj.root.truePosition, 
            [
                vec3.length(obj.position),
                vec3.length(obj.position),
                vec3.length(obj.position)
            ], 
            material,
            [[1,1,1],[1,1,1],[1,1,1],1],
            0, 0, 0
        );
        this.rotation = obj.rotation;
    }
    select(){}
}