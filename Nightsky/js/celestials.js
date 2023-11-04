class Material {
    constructor(kAmb, kDif, kSpe, shininess) {
        this.kAmb = kAmb;
        this.kDif = kDif;
        this.kSpe = kSpe;
        this.shininess = shininess;
    }
}

class CelestialBody {
    constructor(gl, model, position, scale, material, colors) {
        this.gl = gl;
        this.model = model;
        this.position = position;
        this.scale = scale;
        this.material = material;
        this.ambColor = colors[0];
        this.difColor = colors[1];
        this.speColor = colors[2];
        this.objects = [this];
        this.root = null;
    }
    addObject(model, position, scale, material, colors) {
        var truePosition = [
            this.position[0] + position[0],
            this.position[1] + position[1],
            this.position[2] + position[2]
        ];
        this.objects.push(new CelestialBody(
            this.gl,
            model,
            truePosition,
            scale,
            material,
            colors
        ));
        this.objects[this.objects.length - 1].root = this;
    }
    getWorldMats() {
        var worldMat = mat4.create();
        var normalWorldMat = mat4.create();
        mat4.translate(worldMat, worldMat, this.position);
        mat4.scale(worldMat, worldMat, this.scale);
        mat4.invert(normalWorldMat, worldMat);
        mat4.transpose(normalWorldMat, normalWorldMat);
        return[worldMat, normalWorldMat];
    }
    getObjectsToRender() {
        var objectsToRender = [];
        objectsToRender.push(this);
        for (var i = 1; i < this.objects.length; i++) {
            this.objects[i].getObjectsToRender().forEach(obj => {
                objectsToRender.push(obj);
            });
        }
        return objectsToRender;
    }
    update(time, steps) {
        for (var i = 0; i < steps; i++) {
            for (var j = 1; j < this.objects.length; j++) {
                if (this.root != null) {
                    vec3.sub(
                        this.objects[j].position, 
                        this.objects[j].position, 
                        this.root.position
                    );
                }
                var r = vec3.length(this.objects[j].position);
                var w = (2 * Math.PI) / (r*2); //Winkelgeschwindigkeit
                var phi = Math.atan2(this.objects[j].position[0], this.objects[j].position[2]);
                phi = (phi + time * w) % (2 * Math.PI);
                this.objects[j].position = vec3.fromValues(
                    r * Math.sin(phi),
                    0,
                    r * Math.cos(phi)
                );
                if (this.root != null) {
                    vec3.add(
                        this.objects[j].position, 
                        this.objects[j].position, 
                        this.root.position
                    );
                }
                this.objects[j].update(time, 1);
            }
        }
    }
}

class CelestialBodyPhysics extends CelestialBody {
    constructor(gl, model, position, scale, material, colors, velocity, mass) {
        super(gl, model, position, scale, material, colors);
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
}

class Star extends CelestialBody {
    constructor(gl, model, scale, material, colors) {
        super(gl, model, [0,0,0], scale, material, colors);
        this.cams = [
            new Camera(
                this.position,
                vec3.add(vec3.create(), this.position, vec3.fromValues(1,0,0)),
                vec3.fromValues(0,-1,0)
            ),
            new Camera(
                this.position,
                vec3.add(vec3.create(), this.position, vec3.fromValues(-1,0,0)),
                vec3.fromValues(0,-1,0)
            ),
            new Camera(
                this.position,
                vec3.add(vec3.create(), this.position, vec3.fromValues(0,1,0)),
                vec3.fromValues(0,0,1)
            ),
            new Camera(
                this.position,
                vec3.add(vec3.create(), this.position, vec3.fromValues(0,-1,0)),
                vec3.fromValues(0,0,-1)
            ),
            new Camera(
                this.position,
                vec3.add(vec3.create(), this.position, vec3.fromValues(0,0,1)),
                vec3.fromValues(0,-1,0)
            ),
            new Camera(
                this.position,
                vec3.add(vec3.create(), this.position, vec3.fromValues(0,0,-1)),
                vec3.fromValues(0,-1,0)
            ),
        ];
    }
}

class StarPhysics extends CelestialBodyPhysics {
    constructor(gl, model, scale, material, colors, mass) {
        super(gl, model, [0,0,0], scale, material, colors, [0,0,0], mass);
        this.cams = [
            new Camera(
                this.position,
                vec3.add(vec3.create(), this.position, vec3.fromValues(1,0,0)),
                vec3.fromValues(0,-1,0)
            ),
            new Camera(
                this.position,
                vec3.add(vec3.create(), this.position, vec3.fromValues(-1,0,0)),
                vec3.fromValues(0,-1,0)
            ),
            new Camera(
                this.position,
                vec3.add(vec3.create(), this.position, vec3.fromValues(0,1,0)),
                vec3.fromValues(0,0,1)
            ),
            new Camera(
                this.position,
                vec3.add(vec3.create(), this.position, vec3.fromValues(0,-1,0)),
                vec3.fromValues(0,0,-1)
            ),
            new Camera(
                this.position,
                vec3.add(vec3.create(), this.position, vec3.fromValues(0,0,1)),
                vec3.fromValues(0,-1,0)
            ),
            new Camera(
                this.position,
                vec3.add(vec3.create(), this.position, vec3.fromValues(0,0,-1)),
                vec3.fromValues(0,-1,0)
            ),
        ];
    }
}

class BackgroundStar extends CelestialBody {
    constructor(gl, index, cam, model, position, scale, material, colors) {
        super(gl, model, position, scale, material, colors);
        this.index = index;
        this.cam = cam;
    }
    getWorldMats() {
        var posToView = vec3.create();
        vec3.sub(posToView, this.position, this.cam.pos);
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
            pos, 
            [20, length-150, 20], 
            material, 
            [[211/255,89/255,68/255], [1,1,1], [1,1,1]]
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
}

class Orbit extends CelestialBody {
    constructor(gl, model, obj, material) {
        super(
            gl, 
            model, 
            [0,0,0], 
            [vec3.length(obj.position),6000,vec3.length(obj.position)], 
            material,
            [[1,1,1],[1,1,1],[1,1,1]]
        );
    }
}