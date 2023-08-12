// Load a text resource from a file over the network (stolen :3)
var loadTextResource = function (url, callback) {
	var request = new XMLHttpRequest();
	request.open('GET', url + '?please-dont-cache=' + Math.random(), true);
	request.onload = function () {
		if (request.status < 200 || request.status > 299) {
			callback('Error: HTTP Status ' + request.status + ' on resource ' + url);
		} else {
			callback(null, request.responseText);
		}
	};
	request.send();
};

//parse .obj file
function parseModelData(data) {
	//request(filename);
	var positions = [];
	var normals = [];
	var vertices = [];

	var lines = data.split('\n');
	for (var i = 0; i < lines.length; i++) {
		var parts = lines[i].trim().split(' ');
		if (parts[0] === 'v') {
			positions.push(
				parseFloat(parts[1]),
				parseFloat(parts[2]),
				parseFloat(parts[3])
			);
		} else if (parts[0] === 'vn') {
			normals.push(
				parseFloat(parts[1]),
				parseFloat(parts[2]),
				parseFloat(parts[3])
			);
		} else if (parts[0] === 'f') {
			for (var j = 1; j < parts.length; j++) {
				var indexParts = parts[j].split('/');
				var positionIndex = parseInt(indexParts[0]) - 1;
                var normalIndex = parseInt(indexParts[2]) - 1;
				vertices.push(
					positions[positionIndex * 3], 
					positions[positionIndex * 3 + 1], 
					positions[positionIndex * 3 + 2]
				);
                vertices.push(
					normals[normalIndex * 3], 
					normals[normalIndex * 3 + 1], 
					normals[normalIndex * 3 + 2]
				);
			}
		}
	}
	return new Float32Array(vertices);
}

//creates and returns a gl program with given shaders
function createProgram(gl, vertexShader, fragmentShader) {
	 //creating webgl program
	 var program = gl.createProgram();

    //compile the shaders
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("ERROR: compile vertex shader!", gl.getShaderInfoLog(vertexShader));
        return;
    }
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error("ERROR: compile fragment shader!", gl.getShaderInfoLog(fragmentShader));
        return;
    }

    //attach the shaders to the program
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    //link program
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
        return;
    }
    //validate program
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program!', gl.getProgramInfoLog(program));
        return;
    }
	return program;
}

/**
 * Transforms spherical coordinates to cartesian coordinates.
 *
 * @param {number} radius Radius-Coordinate
 * @param {number} theta Theta-Coordinate
 * @param {number} phi Phi-Coordinate
 *
 * @returns {Array<number>} Array of length 3 containing the desired cartesian coordinates.
 */
function sphericalToCartesian(radius, theta, phi) {
	return Array(
		radius * Math.sin(theta) * Math.cos(phi),
		radius * Math.sin(theta) * Math.sin(phi),
		radius * Math.cos(theta)
	);
}