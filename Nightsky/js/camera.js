//camera-class
class Camera {
  //constructor (sets up position, looking direction, forward/up/right vectors)
  constructor(pos, lookAt, up) {
    //creating vectors
    this.forward = vec3.create();
    this.up = vec3.create();
    this.wUp = up; //world-up
    this.wDown = vec3.create();
    this.right = vec3.create();
    //setting vectors
    this.pos = pos;
    vec3.subtract(this.forward, lookAt, this.pos);
    vec3.cross(this.right, this.forward, up);
    vec3.cross(this.up, this.right, this.forward);
    vec3.negate(this.wDown, this.wUp);
    //normalize vectors
    vec3.normalize(this.forward, this.forward);
    vec3.normalize(this.right, this.right);
    vec3.normalize(this.up, this.up);
  }

  //calculate the viewMatrix for the camera
  getViewMat() {
    var out = mat4.create();
    var lookAt = vec3.create();
    vec3.add(lookAt, this.pos, this.forward);
    mat4.lookAt(out, this.pos, lookAt, this.up);
    return out;
  }

  //rotate the camera to the right by given rad
  rotateRight(rad) {
    var rot = mat4.create();
    mat4.fromRotation(rot, rad, this.up);
    var forw = vec4.fromValues(
      this.forward[0],
      this.forward[1],
      this.forward[2],
      0.0
    );
    vec4.transformMat4(forw, forw, rot);
    this.forward = vec3.fromValues(forw[0], forw[1], forw[2]);
    this.realign();
  }

  //rotate the camera forward by given rad
  rotateForward(rad) {
    if ((Math.acos(vec3.dot(this.forward, this.wUp)) > Math.PI/18 
      || rad / Math.abs(rad) == -1)
      && (Math.acos(vec3.dot(this.forward, this.wDown)) > Math.PI/18
      || rad / Math.abs(rad) == 1)) 
    {
      var rot = mat4.create();
      mat4.fromRotation(rot, rad, this.right);
      var forw = vec4.fromValues(
        this.forward[0],
        this.forward[1],
        this.forward[2],
        0.0
      );
      vec4.transformMat4(forw, forw, rot);
      this.forward = vec3.fromValues(forw[0], forw[1], forw[2]);
      this.realign();
    }
    
  }

  //checking on the vectors, so they are still correct after rotation
  realign() {
    vec3.cross(this.right, this.forward, this.wUp);
    vec3.cross(this.up, this.right, this.forward);
    vec3.normalize(this.forward, this.forward);
    vec3.normalize(this.right, this.right);
    vec3.normalize(this.up, this.up);
  }

  //move camera forward by given distance
  moveForward(dist) {
    vec3.scaleAndAdd(this.pos, this.pos, this.forward, dist);
  }

  //move camera to the right by given distance
  moveRight(dist) {
    vec3.scaleAndAdd(this.pos, this.pos, this.right, dist);
  }

  //move camera up by given distance (not used at the moment)
  moveUp(dist) {
    vec3.scaleAndAdd(this.pos, this.pos, [0, 1, 0], dist);
  }
}

class ControllableCamera extends Camera {
  constructor(canvas, pos, lookAt, up) {
    super(pos, lookAt, up);
    this.canvas = canvas;
    var keyDownListener = this.onKeyDown.bind(this);
    var keyUpListener = this.onKeyUp.bind(this);
    var mouseOutListener = this.onMouseOut.bind(this);
    var mouseOverListener = this.onMouseOver.bind(this);
    var mouseDownListener = this.onMouseDown.bind(this);
    var mouseUpListener = this.onMouseUp.bind(this);
    var mouseMoveListener = this.onMouseMove.bind(this);
    //adding the needed eventListener
    window.addEventListener("keydown", keyDownListener);
    window.addEventListener("keyup", keyUpListener);
    canvas.addEventListener("mouseout", mouseOutListener);
    canvas.addEventListener("mouseover", mouseOverListener);
    window.addEventListener("mousedown", mouseDownListener);
    window.addEventListener("mouseup", mouseUpListener);
    window.addEventListener("mousemove", mouseMoveListener);
    this.KeyValues = {
      Mouse: false,
      Mouse_Over: false,
      Forward: false,
      Backward: false,
      Right: false,
      Left: false,
      Up: false,
      Down: false,
      Rot_Forward: false,
      Rot_Backward: false,
      Rot_Right: false,
      Rot_Left: false,
      Boost: false,
      MovmentSpeed: 10,
      RotationSpeed: 1.5,
      MouseRotationSpeed: 0.2,
      MouseMovementX: 0,
      MouseMovementY: 0,
    };
  }

  update(dt) {
    if (this.KeyValues.Boost) {
        this.KeyValues.MovmentSpeed = 1000;
    } else {
      this.KeyValues.MovmentSpeed = 500;
    }
    if (this.KeyValues.Forward && !this.KeyValues.Back) {
      this.moveForward((dt / 1000) * this.KeyValues.MovmentSpeed);
    }
    if (!this.KeyValues.Forward && this.KeyValues.Back) {
      this.moveForward((-dt / 1000) * this.KeyValues.MovmentSpeed);
    }
    if (this.KeyValues.Right && !this.KeyValues.Left) {
      this.moveRight((dt / 1000) * this.KeyValues.MovmentSpeed);
    }
    if (!this.KeyValues.Right && this.KeyValues.Left) {
      this.moveRight((-dt / 1000) * this.KeyValues.MovmentSpeed);
    }
    if (this.KeyValues.Up && !this.KeyValues.Down) {
      this.moveUp((dt / 1000) * this.KeyValues.MovmentSpeed);
    }
    if (!this.KeyValues.Up && this.KeyValues.Down) {
      this.moveUp((-dt / 1000) * this.KeyValues.MovmentSpeed);
    }
    if (this.KeyValues.Rot_Forward && !this.KeyValues.Rot_Backward) {
      this.rotateForward((dt / 1000) * this.KeyValues.RotationSpeed);
    }
    if (!this.KeyValues.Rot_Forward && this.KeyValues.Rot_Backward) {
      this.rotateForward((-dt / 1000) * this.KeyValues.RotationSpeed);
    }
    if (this.KeyValues.Rot_Right && !this.KeyValues.Rot_Left) {
      this.rotateRight((-dt / 1000) * this.KeyValues.RotationSpeed);
    }
    if (!this.KeyValues.Rot_Right && this.KeyValues.Rot_Left) {
      this.rotateRight((dt / 1000) * this.KeyValues.RotationSpeed);
    }
    this.rotateForward(
      (dt / 1000) 
      * this.KeyValues.MouseMovementY 
      * this.KeyValues.MouseRotationSpeed
    );
    this.rotateRight(
      (dt / 1000) 
      * this.KeyValues.MouseMovementX 
      * this.KeyValues.MouseRotationSpeed
    );
    this.KeyValues.MouseMovementX = 0;
    this.KeyValues.MouseMovementY = 0;
    if (this.KeyValues.Boost) {
        this.KeyValues.MovmentSpeed /= 10;
    }
  }

  onMouseOver() {
    this.KeyValues.Mouse_Over = true;
  }

  onMouseOut() {
    this.KeyValues.Mouse_Over = false;
  }

  onMouseDown() {
    this.KeyValues.Mouse = true;
  }

  onMouseUp() {
    this.KeyValues.Mouse = false;
  }

  onMouseMove(m) {
    if (this.KeyValues.Mouse && this.KeyValues.Mouse_Over) {
      this.KeyValues.MouseMovementX -= m.movementX;
      this.KeyValues.MouseMovementY -= m.movementY;
    }
  }

  onKeyDown(e) {
    switch (e.code) {
      case "KeyW":
        this.KeyValues.Forward = true;
        break;
      case "KeyS":
        this.KeyValues.Back = true;
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
        this.KeyValues.Rot_Forward = true;
        break;
      case "ArrowDown":
        this.KeyValues.Rot_Backward = true;
        break;
      case "ArrowRight":
        this.KeyValues.Rot_Right = true;
        break;
      case "ArrowLeft":
        this.KeyValues.Rot_Left = true;
        break;
      case "Space":
        this.KeyValues.Boost = true;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case "KeyW":
        this.KeyValues.Forward = false;
        break;
      case "KeyS":
        this.KeyValues.Back = false;
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
        this.KeyValues.Rot_Forward = false;
        break;
      case "ArrowDown":
        this.KeyValues.Rot_Backward = false;
        break;
      case "ArrowRight":
        this.KeyValues.Rot_Right = false;
        break;
      case "ArrowLeft":
        this.KeyValues.Rot_Left = false;
        break;
      case "Space":
        this.KeyValues.Boost = false;
    }
  }
}