{
    // Load a text resource from a file over the network (stolen :3)
    function loadTextResource(url, callback) {
        let request = new XMLHttpRequest();
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

    function loadImageResource(url, callback) {
        let request = new Image();
        request.onload = function () {
            callback(null, request);
        };
        request.src = url;
    }

    let dataMap = new Map();
    let count = 0;
    function loadResources(textFiles, imageFiles, callback) {
        count = textFiles.length + imageFiles.length;
        textFiles.forEach(filename => {
            loadTextResource(filename, function (err, data) {
                if (err) {
                    alert('ERROR getting data of file ' + filename);
                    console.error(err);
                }
                setDataMap(filename, data, callback);
            });
        });
        imageFiles.forEach(filename => {
            loadImageResource(filename, function (err, data) {
                if (err) {
                    alert('ERROR getting data of file ' + filename);
                    console.error(err);
                }
                setDataMap(filename, data, callback);
            });
        });
    }

    function setDataMap(key, value, callback) {
        dataMap.set(key, value);
        count--;
        if (count == 0) {
            callback();
        }
    }

    function getDataMap(key) {
        return dataMap.get(key);
    }

    //parse .obj file
    function parseModelData(data) {
	    //request(filename);
	    let positions = [];
	    let normals = [];
        let texCoords = [];
	    let vertices = [];

	    let lines = data.split('\n');
	    for (let i = 0; i < lines.length; i++) {
		    let parts = lines[i].trim().split(' ');
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
            } else if (parts[0] === 'vt') {
                texCoords.push(
                    parseFloat(parts[1]),
                    parseFloat(parts[2])
                );
		    } else if (parts[0] === 'f') {
			    for (let j = 1; j < parts.length; j++) {
				    let indexParts = parts[j].split('/');
				    let positionIndex = parseInt(indexParts[0]) - 1;
                    let texCoordIndex = parseInt(indexParts[1]) - 1;
                    let normalIndex = parseInt(indexParts[2]) - 1;
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
                    vertices.push(
                        texCoords[texCoordIndex * 2],
                        texCoords[texCoordIndex * 2 + 1]
                    );
			    }
		    }
	    }
	    return new Float32Array(vertices);
    }

    function parseStarSignData(data, connectionData) {
        const stars = [];
        const sings = new Map();
        const starMap = new Map();
        let lines = connectionData.split('\n');
        for (let i = 1; i < lines.length; i++) {
            let parts = lines[i].trim().split(',');
            if (parts[1] != '' && parts[2] != '') {
                if (sings.get(parts[3]) === undefined) {
                    sings.set(
                        parts[3], 
                        [parseFloat(parts[1]), parseFloat(parts[2])]
                    );
                } else {
                    sings.get(parts[3]).push(
                        parseFloat(parts[1]), 
                        parseFloat(parts[2])
                    );
                }
                if (starMap.get(parseFloat(parts[1])) === undefined) {
                    starMap.set(parseFloat(parts[1]), [parts[3]]);
                } else {
                    starMap.get(parseFloat(parts[1])).push(parts[3]);
                }
                if (starMap.get(parseFloat(parts[2])) === undefined) {
                    starMap.set(parseFloat(parts[2]), [parts[3]]);
                } else {
                    starMap.get(parseFloat(parts[2])).push(parts[3]);
                }
            }
        }
        lines = data.split('\n');
        for (let i = 1; i < lines.length; i++) {
            let parts = lines[i].trim().split(',');
            if (starMap.get(parseFloat(parts[0])) !== undefined) {
                stars.push([
                    parseFloat(parts[0]), 
                    [
                        parseFloat(parts[27]), 
                        parseFloat(parts[28]), 
                        parseFloat(parts[29])
                    ]
                ]);
            }
        }
        return [stars, sings, starMap];
    }

    function parseStarData(data) {
	    let positions = [];
	    let colors = [];
        let sizes = [];
	    let lines = data.split('\n');
	    for (let i = 1; i < lines.length; i++) {
		    let parts = lines[i].trim().split(',');
            let mag = parseFloat(parts[6]);
            let bp_rp = parseFloat(parts[4]);
            let r = Math.fround(
                mag
                +0.10979647
                -0.14579334*Math.pow(bp_rp, 1)
                +0.10747392*Math.pow(bp_rp, 2)
                -0.10635920*Math.pow(bp_rp, 3)
                +0.08494556*Math.pow(bp_rp, 4)
                -0.01368962*Math.pow(bp_rp, 5)
                );
            let g = Math.fround(
                mag
                -0.02330159
                +0.12884074*Math.pow(bp_rp, 1)
                +0.22149167*Math.pow(bp_rp, 2)
                -0.14550480*Math.pow(bp_rp, 3)
                +0.10635149*Math.pow(bp_rp, 4)
                -0.02363990*Math.pow(bp_rp, 5)
            );
            let b = Math.fround(
                mag
                -0.13748689
                +0.44265552*Math.pow(bp_rp, 1)
                +0.37878846*Math.pow(bp_rp, 2)
                -0.14923841*Math.pow(bp_rp, 3)
                +0.09172474*Math.pow(bp_rp, 4)
                -0.02594726*Math.pow(bp_rp, 5)

            );
            let bri = Math.fround(
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
                let pos = vec3.fromValues(
                    parseFloat(parts[7]),
                    parseFloat(parts[8]),
                    parseFloat(parts[9])
                );
                positions.push(pos);
                colors.push([r/5, g/5, b/5, bri]);
                sizes.push(5);
            }
        
	    }
        return [positions, colors, sizes];
    }
}
