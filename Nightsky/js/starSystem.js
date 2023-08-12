class Star {
    constructor(gl, position, size) {
        this.position = position;
        this.size = size;
        this.model = new Sphere(gl, position, size, [0,0,0]);
        //TODO: gravity and stuff
    }
}

class System {
    constructor(gl, scope, amount) {
        this.gl = gl
        this.stars = [];
        for (var i = 0; i < amount; i++) {
            this.stars.push(new Star(
                gl,
                [
                    Math.pow(-1, Math.round(Math.random()))*Math.random()*scope,
                    Math.pow(-1, Math.round(Math.random()))*Math.random()*scope,
                    Math.pow(-1, Math.round(Math.random()))*Math.random()*scope
                ],
                Math.max(Math.random() * 10, 1)
            ));
        }
    }
    addSingle(position, size) {
        this.stars.push(new Star(this.gl, position, size));
    }
    //TODO: gravity and stuff
}