// Load a text resource from a file over the network (stolen :3)
function loadTextResource(url, callback) {
    var request = new XMLHttpRequest();
	request.open('GET', url + '?please-dont-cache=' + Math.random(), true);
	request.onload = function () {
		if (request.status < 200 || request.status > 299) {
			callback(
                'Error: HTTP Status ' 
                + request.status 
                + ' on resource ' 
                + url
            );
		} else {
			callback(null, request.responseText);
		}
	};
	request.send();
}

var dataMap = new Map();
var count = 0;
function loadResources(list) {
    count = list.length;
    list.forEach(filename => {
        loadTextResource(filename, function (err, data) {
            if (err) {
                alert('ERROR getting data of file ' + filename);
                console.error(err);
            }
            setDataMap(filename, data);
        });
    });
}

function setDataMap(key, value) {
    dataMap.set(key, value);
    count--;
    if (count == 0) {
        main();
    }
}

function getDataMap(key) {
    return dataMap.get(key);
}

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

function parseStarData(data) {
    //request(filename);
	var positions = [];
	var colors = [];
    var sizes = [];
	var lines = data.split('\n');
	for (var i = 1; i < lines.length; i++) {
		var parts = lines[i].trim().split(',');
        var mag = parseFloat(parts[6]);
        var bp_rp = parseFloat(parts[4]);
        var r = Math.fround(
            mag
            +0.10979647
            -0.14579334*Math.pow(bp_rp, 1)
            +0.10747392*Math.pow(bp_rp, 2)
            -0.10635920*Math.pow(bp_rp, 3)
            +0.08494556*Math.pow(bp_rp, 4)
            -0.01368962*Math.pow(bp_rp, 5)
            );
        var g = Math.fround(
            mag
            -0.02330159
            +0.12884074*Math.pow(bp_rp, 1)
            +0.22149167*Math.pow(bp_rp, 2)
            -0.14550480*Math.pow(bp_rp, 3)
            +0.10635149*Math.pow(bp_rp, 4)
            -0.02363990*Math.pow(bp_rp, 5)
        );
        var b = Math.fround(
            mag
            -0.13748689
            +0.44265552*Math.pow(bp_rp, 1)
            +0.37878846*Math.pow(bp_rp, 2)
            -0.14923841*Math.pow(bp_rp, 3)
            +0.09172474*Math.pow(bp_rp, 4)
            -0.02594726*Math.pow(bp_rp, 5)

        );
        var bri = Math.fround(
            mag
            -0.01252185
            +0.13983574*Math.pow(bp_rp, 1)
            +0.23688188*Math.pow(bp_rp, 2)
            -0.10175532*Math.pow(bp_rp, 3)
            +0.07401939*Math.pow(bp_rp, 4)
            -0.01821150*Math.pow(bp_rp, 5)
        );
        if (
            parts.length == 10 
            && parts[7] != 'N/A' 
            && parts[8] != 'N/A' 
            && parts[9] != 'N/A'
        ) {
            var pos = vec3.fromValues(
                parseFloat(parts[7]),
                parseFloat(parts[8]),
                parseFloat(parts[9])
            );
            positions.push(pos);
            colors.push([r/5,g/5,b/5]);
            sizes.push(100);
        }
		
	}
    return [positions, colors, sizes];
}
