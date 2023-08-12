//Hashmap (key = filename, value = modeldata) (modelData only gets loaded once)
var dataMap = new Map();

class Object {
  constructor(gl, vertices, position, rotation, scale) {
    this.vertices = vertices;
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

/**
 * Represents a triangle. The triangle's Points a, b, c should be in clockwise order. (Backface Culling)
 */
class Triangle {
  /**
   * Constructor of a Triangle Object.
   *
   * @param {Array<number>} a Array which represents one of the triangle's Points.
   * @param {Array<number>} b Array which represents one of the triangle's Points.
   * @param {Array<number>} c Array which represents one of the triangle's Points.
   */
  constructor(a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;
  }
}

/**
 * Represents a sphere.
 */
class Sphere extends Object {
  /**
   * Constructor of a Sphere Object.
   *
   * @param gl WebGL API.
   * @param {Array<number>} position Array of length 3 containing the position of the sphere.
   * @param {Array<number>} rotation Array of length 3 containing the rotation of the sphere (XYZ).
   * @param {number} scale
   * @param {number} radius Radius of the sphere.
   * @param {number} n_theta Whole number of segments (quadrangles) in theta-direction. The resulting sphere will have the doubled number of triangles in theta-direction.
   * @param {number} n_phi Whole number of segments (quadrangles) in phi-direction. The resulting sphere will have the doubled number of triangles in phi-direction.
   */
  constructor(gl, position, rotation, scale, radius, n_theta, n_phi) {
    super(gl, [] /*PLACEHOLDER*/, position, rotation, scale);
    this.radius = radius;
    this.n_theta = n_theta;
    this.n_phi = n_phi;

    this.vertices = this.getArrayBufferContent();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

    this.recalcWorldMat();
  }

  /**
   * Returns the triangle at the given indices in cartesian-coordinates.
   *
   * Conversions: (Indices to actual spherical Coordinates)
   * theta = index_theta * PI / n_theta
   * phi = index_phi * 2 * PI / n_phi
   *
   * @param {number} index_theta Whole number of the theta-index of the requested segment (quadrangle) on the sphere.
   * @param {number} index_phi Whole number of the phi-index of the requested segment (quadrangle) on the sphere.
   * @param {boolean} index_down If true, the lower triangle of the segment (quadrangle) (the one with lower theta) is returned.
   *
   * @returns {Triangle} The requested triangle.
   */
  getTriangleSphericalIndices(index_theta, index_phi, index_down) {
    // Values of theta and phi represent the corner of the wanted triangle with the smallest values of theta and phi
    let theta = (index_theta % this.n_theta) * Math.PI / this.n_theta;
    let phi = (index_phi % this.n_phi) * 2 * Math.PI / this.n_phi;

    // Calculate the three corners (in spherical coordinates)
    let a;
    let b;
    let c;

    // If theta is at one of the poles of the sphere, we must output a layer consisting only of triangles
    if (index_theta === 0) {
      // We are at the top most point of the sphere -> Calculate a lower triangle
      a = Array(theta, phi + (2 * Math.PI / this.n_phi));
      b = Array(theta + (Math.PI / this.n_theta), phi + (2 * Math.PI / this.n_phi));
      c = Array(theta + (Math.PI / this.n_theta), phi);
    }
    else if (index_theta === this.n_theta - 1) {
      // We are at the low most point of the sphere -> Calculate a upper triangle
      a = Array(theta + (Math.PI / this.n_theta), phi);
      b = Array(theta, phi);
      c = Array(theta, phi + (2 * Math.PI / this.n_phi));
    }
    // Upper triangle
    else if (index_down === false) {
      a = Array(theta + (Math.PI / this.n_theta), phi);
      b = Array(theta, phi);
      c = Array(theta, phi + (2 * Math.PI / this.n_phi));
    }
    // Lower triangle
    else if (index_down) {
      a = Array(theta, phi + (2 * Math.PI / this.n_phi));
      b = Array(theta + (Math.PI / this.n_theta), phi + (2 * Math.PI / this.n_phi));
      c = Array(theta + (Math.PI / this.n_theta), phi);
    }

    let a_cartesian = sphericalToCartesian(this.radius, a[0], a[1]);
    let b_cartesian = sphericalToCartesian(this.radius, b[0], b[1]);
    let c_cartesian = sphericalToCartesian(this.radius, c[0], c[1]);


    return new Triangle(a_cartesian, b_cartesian, c_cartesian);
  }

  /**
   * Returns the triangle at the given single-index in cartesian-coordinates.
   *
   * @param {number} index Whole number of index.
   *
   * @returns {Triangle} The requested triangle.
   */
  getTriangleIndex(index) {
    let index_down = index % 2;
    let index_phi = ((index % (2 * this.n_phi)) - index_down) / 2;
    let index_theta = (index - 2 * index_phi - index_down) / (2 * this.n_phi);

    return this.getTriangleSphericalIndices(index_theta, index_phi, Boolean(index_down));
  }

  /**
   * Returns the whole content of ARRAY_BUFFER as Float32Array.
   *
   * @returns {Float32Array} Content of ARRAY_BUFFER.
   */
  getArrayBufferContent() {
    // For the first and last theta_index only calculate one triangle per phi_index (Simply leave out the index_down variation)
    let triangles = [];
    for(let i_theta = 0; i_theta < this.n_theta; i_theta++) {
      for(let i_phi = 0; i_phi < this.n_phi; i_phi++) {
        if (i_theta === 0 || i_theta === this.n_theta - 1) {
          triangles.push(this.getTriangleSphericalIndices(i_theta, i_phi, false));
        }
        else {
          triangles.push(this.getTriangleSphericalIndices(i_theta, i_phi, false));
          triangles.push(this.getTriangleSphericalIndices(i_theta, i_phi, true));
        }
      }
    }

    let trianglePoints = [];
    triangles.forEach((item) => {
      trianglePoints.push(item.a[0], item.a[1], item.a[2]);
      trianglePoints.push(item.b[0], item.b[1], item.b[2]);
      trianglePoints.push(item.c[0], item.c[1], item.c[2]);
    });

    return new Float32Array(trianglePoints);
  }
}

class ModelObject extends Object{
  constructor(gl, model, position, rotation, scale) {
    //the given modelData needs to be loaded
    if (dataMap.get(model) === undefined) {
      var request = new XMLHttpRequest();
      request.open('GET', model, false);
      request.send();
      dataMap.set(model, request.responseText);
    }
    let vertices = parseModelData(dataMap.get(model));
    super(gl, vertices, position, rotation, scale);
  }
}

class ModelSphere extends ModelObject {
  constructor(gl, position, radius, rotation) {
    super(gl, './models/sphere.obj', position, rotation, vec3.fromValues(radius,radius,radius));
  }
}