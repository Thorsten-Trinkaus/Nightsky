//Hashmap (key = filename, value = modeldata) (modelData only gets loaded once)
var dataMap = new Map();

class Object {
  constructor(gl, model, position, rotation, scale) {
    
    //the given modelData needs to be loaded
    if (dataMap.get(model) === undefined) {
      var request = new XMLHttpRequest();
      request.open('GET', model, false);
      request.send();
      dataMap.set(model, request.responseText);
    }
    this.vertices = parseModelData(dataMap.get(model));
    this.wMat = mat4.create();
    this.normalWMat = mat4.create();
    this.rotation = rotation;
    this.position = position;
    this.scale = scale;
    this.kAmb = Math.random();
    this.kDif = Math.random();
    this.kSpe = Math.random();
    this.diffuseColor = [Math.random(),Math.random(),Math.random()];
    this.specularColor = [Math.random(),Math.random(),Math.random()];
    this.shininess = Math.random() * 40.0;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

    this.recalcWorldMat();
  }

  //moves object in given direction by given distance
  move(direction, distance) {
    var length = Math.sqrt(
      direction[0]*direction[0] + 
      direction[1]*direction[1] + 
      direction[2]*direction[2]
    );
    direction = [
      distance*(direction[0]/length), 
      distance*(direction[1]/length), 
      distance*(direction[2]/length)
    ];
    for (var i = 0; i < this.position.length; i++) {
      this.position[i] += direction[i];
    }
    this.recalcWorldMat();
  }

  rotate(rotation) {
    for (var i = 0; i < this.rotation.length; i++) {
      this.rotation[i] += rotation[i];
    }
    this.recalcWorldMat();
  }

  rescale(scale) {
    for (var i = 0; i < this.scale.length; i++) {
      this.scale[i] *= scale[i];
    }
    this.recalcWorldMat();
  }

  recalcWorldMat() {
    this.wMat = mat4.create();
    mat4.translate(
      this.wMat, 
      this.wMat, 
      vec3.fromValues(this.position[0],this.position[1],this.position[2])
    );
    mat4.rotateX(this.wMat, this.wMat, this.rotation[0]);
    mat4.rotateY(this.wMat, this.wMat, this.rotation[1]);
    mat4.rotateZ(this.wMat, this.wMat, this.rotation[2]);
    mat4.scale(this.wMat, this.wMat, this.scale);
    
    mat4.invert(this.normalWMat, this.wMat);
    mat4.transpose(this.normalWMat, this.normalWMat);
  }
}

class Sphere extends Object {
  constructor(gl, position, radius, rotation) {
    super(gl, './models/sphere.obj', position, rotation, vec3.fromValues(radius,radius,radius));
  }
}