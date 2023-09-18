class CelestialBody {
    constructor(gl, model, position, velocity, size, mass) {
        this.gl = gl;
        this.model = model;
        this.position = vec3.fromValues(position[0], position[1], position[2]);
        this.velocity = vec3.fromValues(velocity[0], velocity[1], velocity[2]);
        this.size = size;
        this.scale = vec3.fromValues(size, size, size);
        this.mass = mass;
        this.G = 6.67430e-11;
        this.objects = [this];
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
    addObject(model, position, velocity, size, mass) {
        var truePosition = [
            this.position[0] + position[0],
            this.position[1] + position[1],
            this.position[2] + position[2]
        ];
        var trueVelocity = [
            this.velocity[0] + velocity[0],
            this.velocity[1] + velocity[1],
            this.velocity[2] + velocity[2]
        ];
        this.objects.push(new CelestialBody(
            this.gl, 
            model,
            truePosition, 
            velocity, 
            size, 
            mass
        ));
    }
    getObjectsToRender() {
        var objectsToRender = [];
        var listOfObjects = [];
        objectsToRender.push(this);
        for (var i = 1; i < this.objects.length; i++) {
            listOfObjects = this.objects[i].getObjectsToRender();
            listOfObjects.forEach(obj => {
                objectsToRender.push(obj);
            });
        }
        return objectsToRender;
    }
    update(time, steps) {
        for (var i = 0; i < steps; i++) {
            for( var j = 1; j < this.objects.length; j++) {
                this.calcVelocity(this.objects[j], time);
            }
            for( var j = 1; j < this.objects.length; j++) {
                this.calcPosition(this.objects[j], time);
            }
        }
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
}

class Star extends CelestialBody {
    constructor(gl, model, size, mass) {
        super(gl, model, [0,0,0], [0,0,0], size, mass);
        this.gl = gl;
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
    constructor(gl, cam, position, color, size) {
        var model = new Model(
            gl, 'circle.obj', 
            color, color, color, 
            1, 1, 1, 1
        );
        super(gl, model, position, [0,0,0], size, 0);
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
    constructor(gl, star1, star2) {
        var model = new Model(
            gl, 'connector.obj', 
            [211/255,89/255,68/255], 
            [1,1,1], 
            [1,1,1], 
            1, 1, 1, 1
        );
        var pos = vec3.create();
        vec3.sub(pos, star1.position, star2.position);
        var length = vec3.length(pos);
        vec3.scale(pos, pos, 0.5);
        vec3.add(pos, pos, star2.position);
        super(gl, model, pos, [0,0,0], 55, 0);
        this.star1 = star1;
        this.star2 = star2;
        this.scale = vec3.fromValues(20, length, 20);
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