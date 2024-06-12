/**
 * A class to represent cameras in the scene.
 */
class Camera {
    /**
     * @constructor
     * @param {![number, number, number]} position - position vector in world 
     *      coordinates
     * @param {![number, number, number]} lookAt - point the camera is 
     *      looking at
     * @param {![number, number, number]} worldUp - "up"-axis of the world
     * @param {!number} angle - angle of view in radians
     */
    constructor(position, lookAt, worldUp, angle) {
        this.angle = angle;
        this.position = position;
        this.worldUp = worldUp;
        // Calculate the unit vectors in camera space.
        vec3.normalize(this.worldUp, this.worldUp);
        this.z = vec3.create();
        vec3.sub(this.z, lookAt, position);
        vec3.normalize(this.z, this.z);
        this.x = vec3.create();
        vec3.cross(this.x, this.z, worldUp);
        this.y = vec3.create();
        vec3.cross(this.y, this.x, this.z);
    }

    /**
     * Getter function for the view matrix.
     * @returns view matrix for this camera
     */
    getViewMatrix() {
        let out = mat4.create();
        let lookAt = vec3.create();
        vec3.add(lookAt, this.z, this.position);
        mat4.lookAt(out, this.position, lookAt, this.y);
        return out;
    }

    /**
     * Function for recalculating the x and y axis of the camera.
     * This is used after rotating the z axis.
     */
    recalc() {
        vec3.normalize(this.z, this.z);
        vec3.cross(this.x, this.z, this.worldUp);
        vec3.cross(this.y, this.x, this.z);
        vec3.normalize(this.x, this.x);
        vec3.normalize(this.y, this.y);
    }

    /**
     * Rotates the z axis of this camera around a given axis by a given angle.
     * @param {!number} rad - angle of rotation in radians
     * @param {![number, number, number]} axis - rotation axis
     */
    rotate(rad, axis) {
        // The camera can not be turned 360 dec in vertical direction. This
        // makes sure the camera is not turned over the limit of 80 dec in
        // both vertical directions.
        let worldDown = vec3.clone(this.worldUp);
        vec3.negate(worldDown, worldDown);
        const check1 = (
            // The camera is still allowed to turn in positive 
            // vertical direction.
            Math.acos(vec3.dot(this.z, this.worldUp)) > Math.PI/18 
            || 
            // Or, the camera will not be turned in positive vertical direction.
            rad / Math.abs(rad) == -1
        );
        const check2 = (
            // The camera is still allowed to turn in negative 
            // vertical direction.
            Math.acos(vec3.dot(this.z, worldDown)) > Math.PI/18 
            || 
            // Or, the camera will not be turned in negative vertical direction.
            rad / Math.abs(rad) == 1
        );
        // If both checks are good, rotate the z axis of the camera around the 
        // given axis by the given amount.
        if (check1 && check2) { 
            let rotMat = mat4.create();
            mat4.fromRotation(rotMat, rad, axis);
            let z4 = vec4.fromValues(this.z[0], this.z[1], this.z[2], 0.0);
            vec4.transformMat4(z4, z4, rotMat);
            this.z = vec3.fromValues(z4[0], z4[1], z4[2]);
            // recalculate the x and y axis of the camera.
            this.recalc();
        }
    }

    /**
     * Rotates the z axis of this camera around a its x axis by a given angle.
     * @param {!number} rad - angle of rotation in radians
     */
    rotateX(rad) {
        this.rotate(rad, this.x);
    }

    /**
     * Rotates the z axis of this camera around a its y axis by a given angle.
     * @param {!number} rad - angle of rotation in radians
     */
    rotateY(rad) {
        this.rotate(rad, this.y);
    }

    /**
     * Moves the position of the camera a given distance in a given direction.
     * @param {![number, number, number]} direction - direction in which the
     *      camera should be moved
     * @param {!number} distance - how far the camera should be moved 
     *      along the direction vector
     */
    move(direction, distance) {
        let dir = vec3.clone(direction);
        vec3.normalize(dir, dir);
        vec3.scaleAndAdd(this.position, this.position, dir, distance);
    }

    /**
     * Moves the position of the camera a given distance along its x axis.
     * @param {!number} distance - how far the camera should be moved
     */
    moveX(distance) {
        this.move(this.x, distance);
    }

    /**
     * Moves the position of the camera a given distance along its y axis.
     * @param {!number} distance - how far the camera should be moved
     */
    moveY(distance) {
        this.move(this.y, distance);
    }

    /**
     * Moves the position of the camera a given distance along its z axis.
     * @param {!number} distance - how far the camera should be moved
     */
    moveZ(distance) {
        this.move(this.z, distance);
    }
}

/**
 * A class to represent a Camera object, that can be controlled by the user.
 * It is important to note that the function finalize() should be called 
 * before deleting this object. Else, the event listener will remain.
 * @extends Camera
 */
class ControllableCamera extends Camera {
    /**
     * @constructor
     * @param {!HTMLCanvasElement} canvas - HTML canvas needed to track mouse 
     *      movement
     * @param {![number, number, number]} position - position vector in world 
     *      coordinates
     * @param {![number, number, number]} lookAt - point the camera is 
     *      looking at
     * @param {![number, number, number]} worldUp - "up"-axis of the world
     * @param {!number} angle - angle of view in radians
     */
    constructor(canvas, position, lookAt, worldUp, angle) {
        // Calls the constructor of the base class Camera.
        super(position, lookAt, worldUp, angle);

        this.canvas = canvas;
        // Create event listener needed to control the camera.
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
        // Key values needed for movement and rotation.
        this.KeyValues = {
            Mouse:      false,      // is the mouse-button pressed?
            MouseOver:  true,       // is the mouse cursor over the canvas?
            Forward:    false,      // is the forward-button pressed?
            Backward:   false,      // is the backward-button pressed?
            Right:      false,      // is the right-button pressed?
            Left:       false,      // is the left-button pressed?
            Up:         false,      // is the up-button pressed?
            Down:       false,      // is the down-button pressed?
            RotX:       false,      // is the rotationX-button pressed?
            RotNegX:    false,      // is the negativeRotationX-button pressed?
            RotY:       false,      // is the rotationY-button pressed?
            RotNegY:    false,      // is the negativeRotationY-button pressed?
            Boost:      [
                        false,      // is the boost-button pressed?
                        0           // 1 or 0. is the boost active?
                        ]
        };
        // Relative movement of the mouse cursor in [x,y] used for rotation.
        this.mouseMovement = [0.0, 0.0];
        // General speed values needed for movement and rotation.
        this.movementSpeed = 0.1;
        this.rotationSpeed = 0.0005;
        this.mouseRotationSpeed = 0.0002;
    }

    /**
     * Function to remove the event listener.
     * This function should be called before deleting the camera object.
     */
    finalize() {
        window.removeEventListener("keydown", this.keyDownListener);
        window.removeEventListener("keyup", this.keyUpListener);
        this.canvas.removeEventListener("mouseout", this.mouseOutListener);
        this.canvas.removeEventListener("mouseover", this.mouseOverListener);
        window.removeEventListener("mousedown", this.mouseDownListener);
        window.removeEventListener("mouseup", this.mouseUpListener);
        window.removeEventListener("mousemove", this.mouseMoveListener);
    }

    /**
     * This function updates the movement and rotation of the camera.
     * @param {!number} dt - delta time
     */
    update(dt) {
        // Is the Boost Key pressed and the Boost isn't activ yet?
        if (this.KeyValues.Boost[0] && this.KeyValues.Boost[1] == 0) {
            this.movementSpeed *= 10.0;
            this.KeyValues.Boost[1] = 1;
        } 
        // Is the Boost Key not pressed and the Boost is still activ?
        else if (!this.KeyValues.Boost[0] && this.KeyValues.Boost[1] == 1) {
            this.movementSpeed /= 10.0;
            this.KeyValues.Boost[1] = 0;
        }
        // Movement along the z axis of the camera.
        if (this.KeyValues.Forward && !this.KeyValues.Backward) {
            this.moveZ(dt * this.movementSpeed);
        } else if (this.KeyValues.Backward && !this.KeyValues.Forward) {
            this.moveZ(-dt * this.movementSpeed);
        }
        // Movement along the x axis of the camera.
        if (this.KeyValues.Right && !this.KeyValues.Left) {
            this.moveX(dt * this.movementSpeed);
        } else if (this.KeyValues.Left && !this.KeyValues.Right) {
            this.moveX(-dt * this.movementSpeed);
        }
        // Movement along the y axis of the camera.
        if (this.KeyValues.Up && !this.KeyValues.Down) {
            this.moveY(dt * this.movementSpeed);
        } else if (this.KeyValues.Down && !this.KeyValues.Up) {
            this.moveY(-dt * this.movementSpeed);
        }
        // Rotation around the x axis of the camera based on rotation keys.
        if (this.KeyValues.RotX && !this.KeyValues.RotNegX) {
            this.rotateX(dt * this.rotationSpeed);
        } else if (this.KeyValues.RotNegX && !this.KeyValues.RotX) {
            this.rotateX(-dt * this.rotationSpeed);
        }
        // Rotation around the y axis of the camera based on rotation keys.
        if (this.KeyValues.RotY && !this.KeyValues.RotNegY) {
            this.rotateY(-dt * this.rotationSpeed);
        } else if (this.KeyValues.RotNegY && !this.KeyValues.RotY) {
            this.rotateY(dt * this.rotationSpeed);
        }
        // Rotation based on mouse movement since the last update call.
        this.rotateX(dt * this.mouseMovement[1] * this.mouseRotationSpeed);
        this.rotateY(dt * this.mouseMovement[0] * this.mouseRotationSpeed);
        // Reseting the mouse movement.
        this.mouseMovement = [0.0, 0.0];
    }

    /**
     * This function is called by the keydown event listener.
     * @param {!Event} e - the event happening
     */
    onKeyDown(e) {
        // Set the KeyValues based on the pressed key.
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

    /**
     * This function is called by the keyup event listener.
     * @param {!Event} e - the event happening
     */
    onKeyUp(e) {
        // Set the KeyValues based on the unpressed key.
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

    /**
     * This function is called by the mousedown event listener.
     * @param {!MouseEvent} e - the mouse event happening
     */
    onMouseDown(e) {
        // Set the Mouse KeyValue to true, if the left mouse button is pressed.
        if (e.button == 0) {
            this.KeyValues.Mouse = true;
        }
    }

    /**
     * This function is called by the mouseup event listener.
     * @param {!MouseEvent} e - the mouse event happening
     */
    onMouseUp(e) {
        // Set the Mouse KeyValue to true, if the left mouse button 
        // is unpressed.
        if (e.button == 0) {
            this.KeyValues.Mouse = false;
        }
    }

    /**
     * This function is called by the mouseout event listener.
     * This sets KeyValues.MouseOver to false.
     */
    onMouseOut() {
        this.KeyValues.MouseOver = false;
    }

    /**
     * This function is called by the mouseover event listener.
     * This sets KeyValues.MouseOver to true.
     */
    onMouseOver() {
        this.KeyValues.MouseOver = true;
    }

    /**
     * This function is called by the mousemove event listener.
     * @param {!MouseEvent} e - the mouse event happening
     */
    onMouseMove(e) {
        // Is the mouse button pressed and the mouse cursor is over the canvas?
        if (this.KeyValues.Mouse && this.KeyValues.MouseOver) {
            // Update the mouse movement.
            this.mouseMovement[0] -= e.movementX;
            this.mouseMovement[1] -= e.movementY;
          }
    }
}