class Camera {
    constructor(position, lookAt, worldUp, angle) {
        this.worldUp = worldUp;
        vec3.normalize(this.worldUp, this.worldUp);
        this.position = position;
        this.z = vec3.create();
        vec3.sub(this.z, lookAt, position);
        vec3.normalize(this.z, this.z);
        this.x = vec3.create();
        vec3.cross(this.x, this.z, worldUp);
        this.y = vec3.create();
        vec3.cross(this.y, this.x, this.z);
        this.angle = angle;
    }

    getViewMatrix() {
        var out = mat4.create();
        var lookAt = vec3.create();
        vec3.add(lookAt, this.z, this.position);
        mat4.lookAt(out, this.position, lookAt, this.y);
        return out;
    }

    reCalc() {
        vec3.normalize(this.z, this.z);
        vec3.cross(this.x, this.z, this.worldUp);
        vec3.cross(this.y, this.x, this.z);
        vec3.normalize(this.x, this.x);
        vec3.normalize(this.y, this.y);
    }

    rotate(rad, axis) {
        var worldDown = vec3.clone(this.worldUp);
        var xxx = vec3.create(); 
        vec3.negate(worldDown, worldDown);
        var check1 = (Math.acos(vec3.dot(this.z, this.worldUp)) > Math.PI/18 || 
            rad / Math.abs(rad) == -1);
        var check2 = (Math.acos(vec3.dot(this.z, worldDown)) > Math.PI/18 || 
            rad / Math.abs(rad) == 1);
        if (check1 && check2) { 
            var rotMat = mat4.create();
            mat4.fromRotation(rotMat, rad, axis);
            var z4 = vec4.fromValues(this.z[0], this.z[1], this.z[2], 0.0);
            vec4.transformMat4(z4, z4, rotMat);
            this.z = vec3.fromValues(z4[0], z4[1], z4[2]);
            this.reCalc();
        }
    }
    rotateX(rad) {
        this.rotate(rad, this.x);
    }
    rotateY(rad) {
        this.rotate(rad, this.y);
    }
    rotateZ(rad) {
        this.rotate(rad, this.z);
    }

    move(direction, distance) {
        var dir = vec3.clone(direction);
        vec3.normalize(dir, dir);
        vec3.scaleAndAdd(this.position, this.position, dir, distance);
    }
    moveX(distance) {
        this.move(this.x, distance);
    }
    moveY(distance) {
        this.move(this.y, distance);
    }
    moveZ(distance) {
        this.move(this.z, distance);
    }
}

class ControllableCamera extends Camera {
    constructor(canvas, position, lookAt, worldUp, angle) {
        super(position, lookAt, worldUp, angle);
        this.canvas = canvas;
        this.keyDownListener = this.onKeyDown.bind(this);
        this.keyUpListener = this.onKeyUp.bind(this);
        this.mouseOutListener = this.onMouseOut.bind(this);
        this.mouseOverListener = this.onMouseOver.bind(this);
        this.mouseDownListener = this.onMouseDown.bind(this);
        this.mouseUpListener = this.onMouseUp.bind(this);
        this.mouseMoveListener = this.onMouseMove.bind(this);
        window.addEventListener("keydown", this.keyDownListener);
        window.addEventListener("keyup", this.keyUpListener);
        canvas.addEventListener("mouseout", this.mouseOutListener);
        canvas.addEventListener("mouseover", this.mouseOverListener);
        window.addEventListener("mousedown", this.mouseDownListener);
        window.addEventListener("mouseup", this.mouseUpListener);
        window.addEventListener("mousemove", this.mouseMoveListener);
        this.KeyValues = {
            Mouse:      false,
            Mouse_Over: true,
            Forward:    false,
            Backward:   false,
            Right:      false,
            Left:       false,
            Up:         false,
            Down:       false,
            RotX:       false,
            RotNegX:    false,
            RotY:       false,
            RotNegY:    false,
            Boost:      [false, 0]
        };
        this.mouseMovement = [0.0, 0.0];
        this.movementSpeed = 0.1;
        this.rotationSpeed = 0.0005;
        this.mouseRotationSpeed = 0.0002;
    }

    finalize() {
        window.removeEventListener("keydown", this.keyDownListener);
        window.removeEventListener("keyup", this.keyUpListener);
        this.canvas.removeEventListener("mouseout", this.mouseOutListener);
        this.canvas.removeEventListener("mouseover", this.mouseOverListener);
        window.removeEventListener("mousedown", this.mouseDownListener);
        window.removeEventListener("mouseup", this.mouseUpListener);
        window.removeEventListener("mousemove", this.mouseMoveListener);
    }

    update(dt) {
        if (this.KeyValues.Boost[0] && this.KeyValues.Boost[1] == 0) {
            this.movementSpeed *= 10.0;
            this.KeyValues.Boost[1] = 1;
        } else if (!this.KeyValues.Boost[0] && this.KeyValues.Boost[1] == 1) {
            this.movementSpeed /= 10.0;
            this.KeyValues.Boost[1] = 0;
        }
        if (this.KeyValues.Forward && !this.KeyValues.Backward) {
            this.moveZ(dt * this.movementSpeed);
        } else if (this.KeyValues.Backward && !this.KeyValues.Forward) {
            this.moveZ(-dt * this.movementSpeed);
        }
        if (this.KeyValues.Right && !this.KeyValues.Left) {
            this.moveX(dt * this.movementSpeed);
        } else if (this.KeyValues.Left && !this.KeyValues.Right) {
            this.moveX(-dt * this.movementSpeed);
        }
        if (this.KeyValues.Up && !this.KeyValues.Down) {
            this.moveY(dt * this.movementSpeed);
        } else if (this.KeyValues.Down && !this.KeyValues.Up) {
            this.moveY(-dt * this.movementSpeed);
        }
        if (this.KeyValues.RotX && !this.KeyValues.RotNegX) {
            this.rotateX(dt * this.rotationSpeed);
        } else if (this.KeyValues.RotNegX && !this.KeyValues.RotX) {
            this.rotateX(-dt * this.rotationSpeed);
        }
        if (this.KeyValues.RotY && !this.KeyValues.RotNegY) {
            this.rotateY(-dt * this.rotationSpeed);
        } else if (this.KeyValues.RotNegY && !this.KeyValues.RotY) {
            this.rotateY(dt * this.rotationSpeed);
        }
        this.rotateX(dt * this.mouseMovement[1] * this.mouseRotationSpeed);
        this.rotateY(dt * this.mouseMovement[0] * this.mouseRotationSpeed);
        this.mouseMovement = [0.0, 0.0];
    }

    onKeyDown(e) {
        switch (e.code) {
            case "KeyW":
                this.KeyValues.Forward = true;
                break;
            case "KeyS":
                this.KeyValues.Backward = true;
                break;
            case "KeyD":
                this.KeyValues.Right = true;
                break;
            case "KeyA":
                this.KeyValues.Left = true;
                break;
            case "KeyQ":
                this.KeyValues.Up = true;
                break;
            case "KeyE":
                this.KeyValues.Down = true;
                break;
            case "ArrowUp":
                this.KeyValues.RotX = true;
                break;
            case "ArrowDown":
                this.KeyValues.RotNegX = true;
                break;
            case "ArrowRight":
                this.KeyValues.RotY = true;
                break;
            case "ArrowLeft":
                this.KeyValues.RotNegY = true;
                break;
            case "Space":
                this.KeyValues.Boost[0] = true;
                break;
        }
    }

    onKeyUp(e) {
        switch (e.code) {
            case "KeyW":
                this.KeyValues.Forward = false;
                break;
            case "KeyS":
                this.KeyValues.Backward = false;
                break;
            case "KeyD":
                this.KeyValues.Right = false;
                break;
            case "KeyA":
                this.KeyValues.Left = false;
                break;
            case "KeyQ":
                this.KeyValues.Up = false;
                break;
            case "KeyE":
                this.KeyValues.Down = false;
                break;
            case "ArrowUp":
                this.KeyValues.RotX = false;
                break;
            case "ArrowDown":
                this.KeyValues.RotNegX = false;
                break;
            case "ArrowRight":
                this.KeyValues.RotY = false;
                break;
            case "ArrowLeft":
                this.KeyValues.RotNegY = false;
                break;
            case "Space":
                this.KeyValues.Boost[0] = false;
                break;
        }
    }

    onMouseDown(e) {
        if (e.button == 0) {
            this.KeyValues.Mouse = true;
        }
    }

    onMouseUp(e) {
        if (e.button == 0) {
            this.KeyValues.Mouse = false;
        }
    }

    onMouseOut() {
        this.KeyValues.Mouse_Over = false;
    }

    onMouseOver() {
        this.KeyValues.Mouse_Over = true;
    }

    onMouseMove(e) {
        if (this.KeyValues.Mouse && this.KeyValues.Mouse_Over) {
            this.mouseMovement[0] -= e.movementX;
            this.mouseMovement[1] -= e.movementY;
          }
    }
}