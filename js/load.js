{
    /**
     * @async
     * This function opens a file and copys the text inside the file as a 
     * string. A callback function is called with this string as input.
     * @param {!string} path - path of the file that should be opened
     * @param {!function} callback - callback function to be called
     */
    async function loadTextResource(path, callback) {
        fetch(path)                             // Fetch file from path.
            .then((file) => file.text())        // Get the text content.
            .then((text) => {                   // Call the callback function.
                callback(text);
            })
            .catch((e) => console.error(        // Catch errors and display 
                "ERROR getting data of file "   // them on the console.
                + path 
                + ": " 
                + e
            ));                    
    }

    /**
     * @async
     * This function opens a image-file and copys the image as a 
     * HTMLImageElement. For this, the function creates a promise, that is
     * resolved as soon as the image has been loaded. If the function fails 
     * to load the image, the promise is rejected.
     * @param {!string} path - path of the file that should be opened
     * @returns {!Promise} promise - the promise to be fulfilled
     */
    async function fetchImage(path) {
        // Create the promise.
        const promise = new Promise( function(resolve, reject) {
            // Create a new HTMLImageElement.
            const image = new Image();
            // Resolve the promise, if the image has been loaded.
            image.onload = function() {
                resolve(image);     // The resolve returns the image.
            }
            // Reject the promise, if there has been an error.
            image.onerror = function() {
                reject(path);       // The rejection returns the path.
            }
            // Specify the image-url for the HTMLImageElement.
            image.src = path;
        });
        // Return the promise.
        return promise;
    }

    /**
     * @async
     * This function uses fetchImage() to open a image-file and calls a
     * callback function with the image as input.
     * @param {!string} path - path of the file that should be opened
     * @param {!function} callback - callback function to be called
     */
    async function loadImageResource(path, callback) {
        fetchImage(path)                        // Fetch image from path.
            .then((image) => {                  // Call the callback function.
                callback(image);
            })
            .catch((error) => {                  // Catch errors and display                       
                console.error(                  // them on the console.
                "ERROR getting data of file "   
                + path + ": " + error
                );
                
                if (count > 0) {                // This is only useful if this
                    count--;                    // this function gets called
                }                               // from loadResources().
        });
    }

    // These are used for the function loadResources(). The function loads
    // multiple files at once (also text and image files at the same time).
    // dataMap saves all the loaded results, where the key is the path and 
    // the value is the result. count is the amount of files that should be
    // loaded, so the callback function of loadResources() gets called only
    // after all files have been loaded.
    const dataMap = new Map();
    let count = 0;
    /**
     * This function allows for multiple text and image files to be loaded at
     * once. The data gets saved to the dataMap via setDataMap(). The data can
     * be accessed through the function getDataMap(). After loading all files,
     * a callback function is called through setDataMap().
     * @param {!string[]} textFiles - a list of paths for all text files
     * @param {!string[]} imageFiles - a list of paths for all image files
     * @param {!function} callback  - callback function to be called
     */
    function loadResources(textFiles, imageFiles, callback) {
        // The amount of files that should be loaded.
        count = textFiles.length + imageFiles.length;
        // Load all text files and use setDataMap() to 
        // insert the data into the map.
        textFiles.forEach(filename => {
            loadTextResource(
                filename, 
                function (data) {
                    setDataMap(filename, data, callback);
                }
            );
        });
        // Load all image files and use setDataMap() to 
        // insert the images into the map.
        imageFiles.forEach(filename => {
            loadImageResource(
                filename, 
                function (data) {
                    setDataMap(filename, data, callback);
                }
            );
        });
    }

    /**
     * This is a helper-function for the function loadResources(). This
     * function inserts the loaded data into the dataMap with a given key.
     * This function also gets the callback function from loadResources.
     * Every time the data of a file is inserted, this function counts down 
     * the count. When the count hits 0 all files have been loaded and the
     * callback function is called.
     * @param {!string} key - key for the dataMap
     * @param {!(string | HTMLImageElement)} value - value for the dataMap 
     * @param {!function} callback - callback function to be called
     */
    function setDataMap(key, value, callback) {
        // Set the dataMap.
        dataMap.set(key, value);
        // Countdown count.
        count--;
        // Call callback, if all files have been loaded.
        if (count == 0) {
            callback();
        }
    }

    /**
     * This is a getter-function for the dataMap.
     * @param {!string} key - key of the needed entry
     * @returns {!(string | HTMLImageElement)} returns the value
     */
    function getDataMap(key) {
        return dataMap.get(key);
    }

    /**
     * This function parses a .obj file given as a string and returns 
     * a Float32Array with the vertex positions, normals and texture 
     * coordinates from the file. The array has the form:
     * [
     *      position-x, position-y, position-z,     | vertex 1
     *      normal-x, normal-y, normal-z,           | vertex 1
     *      texture-x, texture-y,                   | vertex 1
     *      ...,                                    | vertex 2
     *      ...                                     | ...
     * ]
     * @param {!string} data - .obj file as a string
     * @returns {!Float32Array} returns the vertices array
     */
    function parseModelData(data) {
        // Array for all the vertex positions.
	    let positions = [];
        // Array for all vertex normals.
	    let normals = [];
        // Array for all vertex texture coordinates.
        let texCoords = [];
        // Array to be returned at the end.
	    let vertices = [];
        // Split the file into lines.
	    let lines = data.split("\n");
        // For every line in the file.
	    for (let i = 0; i < lines.length; i++) {
            // Split the line into individual words / numbers.
		    let parts = lines[i].trim().split(" ");
            // If the line starts with v, the line has vertex positions.
            // Else if the line starts with vn, the line has vertex normals.
            // Else if the line starts with vt, the line has vertex 
            // texture coordinates.
            // Every line represents a vertex, but these are not sorted over 
            // position, normal and texture coordinate.
            // Else if the line starts with f, the line has indices for the 
            // positions, normals and texCoords arrays. These are sorted by 
            // vertex. 
		    if (parts[0] === "v") {
                // Add the position values of the line to the positions array.
			    positions.push(
				    parseFloat(parts[1]),
				    parseFloat(parts[2]),
				    parseFloat(parts[3])
			    );
		    } else if (parts[0] === "vn") {
                // Add the normal values of the line to the normals array.
			    normals.push(
				    parseFloat(parts[1]),
				    parseFloat(parts[2]),
				    parseFloat(parts[3])
			    );
            } else if (parts[0] === "vt") {
                // Add the texture coordinate values of the line to the 
                // texCoords array.
                texCoords.push(
                    parseFloat(parts[1]),
                    parseFloat(parts[2])
                );
		    } else if (parts[0] === "f") {
                // For all parts of the line. Every part represents a vertex.
			    for (let j = 1; j < parts.length; j++) {
                    // Split the part into separate indices.
				    let indexParts = parts[j].split("/");
                    // index - 1 because the arrays start at 0 but the .obj 
                    // file starts at 1.
				    let positionIndex = parseInt(indexParts[0]) - 1;
                    let texCoordIndex = parseInt(indexParts[1]) - 1;
                    let normalIndex = parseInt(indexParts[2]) - 1;
                    // Add the position of the vertex to the vertices array.
				    vertices.push(
					    positions[positionIndex * 3], 
					    positions[positionIndex * 3 + 1], 
					    positions[positionIndex * 3 + 2]
				    );
                    // Add the normal of the vertex to the vertices array.
                    vertices.push(
					    normals[normalIndex * 3], 
					    normals[normalIndex * 3 + 1], 
					    normals[normalIndex * 3 + 2]
				    );
                    // Add the texture coordinates of the vertex to the array.
                    vertices.push(
                        texCoords[texCoordIndex * 2],
                        texCoords[texCoordIndex * 2 + 1]
                    );
			    }
		    }
	    }
        // return the array of all vertices.
	    return new Float32Array(vertices);
    }

    /**
     * @typedef {![number,[number,number,number]][]} stars
     */
    /**
     * This function parses the data for the star signs. For this it needs 
     * to files as strings: a list of all the stars needed for the star signs
     * and a list of all the connections between those stars.
     * The list of stars should be of form:
     *      HIP | RAJ2000 | DEJ2000 | distance | x | y | z | Vmag_viz 
     *      ---------------------------------------------------------
     * The list of connections should be of form:
     *      number | From_HIP | To_HIP | Cst
     *      --------------------------------
     * This function returns the data of the stars and connections with an 
     * array and 2 maps. They are returned in an array:
     * [
     *      star data:      [HIP, [position-x, position-y, position-z]]
     *      star sign map:  key  :  Name of the star sign.
     *                      value:  List of HIPs, where 2 of them should be
     *                              connected respectively.
     *      star map:       key  :  HIP of the star.
     *                      value:  List of star sign names, where the star is
     *                              a part of.
     * ]
     * @param {!string} data - list of stars
     * @param {!string} connectionData - list of connections
     * @returns {[stars, Map<string, number[]>, Map<number, string[]>]} returns 
     *      the star and connection data
     */
    function parseStarSignData(data, connectionData) {
        const stars = [];
        const sings = new Map();
        const starMap = new Map();
        // Split the list of connections into lines.
        let lines = connectionData.split("\n");
        // For every line of the list of connections.
        for (let i = 1; i < lines.length; i++) {
            // Split the line into its parts.
            let parts = lines[i].trim().split(",");
            // If both HIPs are not empty (there are 
            // empty spots in the data that should be
            // skiped).
            if (parts[1] != "" && parts[2] != "") {
                // If this star sign is not in the star sign map yet, create
                // a new entry. Else, add the HIPs to the entry of the sign.
                if (sings.get(parts[3]) === undefined) {
                    sings.set(
                        parts[3], 
                        [parseFloat(parts[1]), parseFloat(parts[2])]
                    );
                } else {
                    sings.get(parts[3]).push(
                        parseFloat(parts[1]), parseFloat(parts[2])
                    );
                }
                // If the first HIP is not part of any sign yet, create a new 
                // entry in the star map. Else add the sign to the entry.
                if (starMap.get(parseFloat(parts[1])) === undefined) {
                    starMap.set(parseFloat(parts[1]), [parts[3]]);
                } else {
                    starMap.get(parseFloat(parts[1])).push(parts[3]);
                }
                // If the second HIP is not part of any sign yet, create a new 
                // entry in the star map. Else add the sign to the entry.
                if (starMap.get(parseFloat(parts[2])) === undefined) {
                    starMap.set(parseFloat(parts[2]), [parts[3]]);
                } else {
                    starMap.get(parseFloat(parts[2])).push(parts[3]);
                }
            }
        }
        // Split the list of stars into lines.
        lines = data.split("\n");
        // For every line of the list of stars.
        for (let i = 1; i < lines.length; i++) {
            // Split the line into its parts.
            let parts = lines[i].trim().split(",");
            // If there is any sign, which this star is a part of, add it
            // to the array of stars. If there is no such sign, this star
            // is not needed and does not get added to the list of stars.
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
        // Return the data.
        return [stars, sings, starMap];
    }

    /**
     * @typedef {[number, number, number][]} positions
     * @typedef {[number, number, number][]} colors
     */
    /**
     * This function parses the gaia data given as a string.
     * This function is deprecated. The new function parseStarData() 
     * provides better color values.
     * 
     * The data should be of form:
     *      source_id | ra | dec | pseudocolour | bp_rp 
     *      -------------------------------------------
     *      dist | gmag | x | y | z
     *      -----------------------
     * The function returns an array of all the position, color and 
     * size values. The resulting array has the form:
     * [
     *      positions: [number, number, number][] - Positions of the
     *                                              objects in the dataset
     *                                              in xyz-coordinates.
     *      colors: [number, number, number][] - Colors of the objects
     *                                           in the dataset in rgb.
     *      sizes:  number[] - Scaling of the objects in the dataset in 
     *                         xyz-direction. Only 1 number, because the
     *                         scaling is the same in all directions.
     * ]
     * @param {!string} data - gaia data as string
     * @returns {![positions, colors, number[]]} returns the values in an array
     */
    function parseStarDataOld(data) {
        // Array of all positions.
	    let positions = [];
        // Array of all color values.
	    let colors = [];
        let maxR = 0;
        let maxG = 0;
        let maxB = 0;
        // Array of all sizes.
        let sizes = [];
        // Split the data into lines.
	    let lines = data.split("\n");
        // For every line.
	    for (let i = 1; i < lines.length; i++) {
            // Split the line into its parts.
		    let parts = lines[i].trim().split(",");
            // calculate RGB-magnitudes. For more information see
            // https://arxiv.org/pdf/2107.08734.
            const mag = parseFloat(parts[6]);
            const bp_rp = parseFloat(parts[4]);
            let r = Math.fround(
                mag
                +0.10979647*Math.pow(bp_rp, 1)
                -0.14579334*Math.pow(bp_rp, 2)
                +0.10747392*Math.pow(bp_rp, 3)
                -0.10635920*Math.pow(bp_rp, 4)
                +0.08494556*Math.pow(bp_rp, 5)
                -0.01368962*Math.pow(bp_rp, 6)
                );
            let g = Math.fround(
                mag
                -0.02330159*Math.pow(bp_rp, 1)
                +0.12884074*Math.pow(bp_rp, 2)
                +0.22149167*Math.pow(bp_rp, 3)
                -0.14550480*Math.pow(bp_rp, 4)
                +0.10635149*Math.pow(bp_rp, 5)
                -0.02363990*Math.pow(bp_rp, 6)
            );
            let b = Math.fround(
                mag
                -0.13748689*Math.pow(bp_rp, 1)
                +0.44265552*Math.pow(bp_rp, 2)
                +0.37878846*Math.pow(bp_rp, 3)
                -0.14923841*Math.pow(bp_rp, 4)
                +0.09172474*Math.pow(bp_rp, 5)
                -0.02594726*Math.pow(bp_rp, 6)

            );
            // Add position values for the object, if there is information 
            // about its position in the gaia data. Missing position data
            // should be marked as "N/A" in the gaia data. If the data is
            // missing, we ignore the object. Else, we also add color and 
            // size values.
            if (
                parts.length == 10 
                && parts[7] != "N/A" 
                && parts[8] != "N/A" 
                && parts[9] != "N/A"
                && r >= 0
                && g >= 0
                && b >= 0
            ) {
                positions.push([
                    parseFloat(parts[7]),
                    parseFloat(parts[8]),
                    parseFloat(parts[9])
                ]);
                /**
                 * @todo This function does not compute RGB values in the 
                 * range [0,1]. It only computes the RGB-magnitudes. Missing
                 * here is a way to get values in the range [0,1] from the
                 * magnitudes. Currently all objects are pretty bright,
                 * because nearly all magnitudes are larger than 5.
                 */
                r = Math.pow(10, -0.4 * r);
                g = Math.pow(10, -0.4 * g);
                b = Math.pow(10, -0.4 * b);
                if (r > maxR) {
                    maxR = r;
                }
                if (g > maxG) {
                    maxG = g;
                }
                if(b > maxB) {
                    maxB = b;
                }
                colors.push([r,g,b]);
                // In its current version, this function assigns the same
                // size to all objects. One could for example change this 
                // to size objects smaller the further they are away from 
                // the center.
                sizes.push(7);
            }
	    }
        console.log(maxR,maxG,maxB)
        for (let i = 0; i < colors.length; i++) {
            colors[i][0] = Math.pow(colors[i][0] / maxR, 1/20);
            colors[i][1] = Math.pow(colors[i][1] / maxG, 1/20);
            colors[i][2] = Math.pow(colors[i][2] / maxB, 1/20);
            console.log(colors[i][0] * 255,colors[i][1] * 255,colors[i][2] * 255)
        }
        
        // Return the array of position, color and size values.
        return [positions, colors, sizes];
    }

    /**
     * @typedef {[number, number, number][]} positions
     * @typedef {[number, number, number][]} colors
     */
    /**
     * This function parses the gaia data given as a string.
     * 
     * The data should be of form:
     *      source_id | ra | dec | pseudocolour | bp_rp 
     *      -------------------------------------------
     *      dist | gmag | x | y | z
     *      -----------------------
     * The function returns an array of all the position, color and 
     * size values. The resulting array has the form:
     * [
     *      positions: [number, number, number][] - Positions of the
     *                                              objects in the dataset
     *                                              in xyz-coordinates.
     *      colors: [number, number, number][] - Colors of the objects
     *                                           in the dataset in rgb.
     *      sizes:  number[] - Scaling of the objects in the dataset in 
     *                         xyz-direction. Only 1 number, because the
     *                         scaling is the same in all directions.
     * ]
     * @param {!string} data - gaia data as string
     * @returns {![positions, colors, number[]]} returns the values in an array
     */
    function parseStarData(data) {
        // Array of all positions.
        let positions = [];
        // Array of all color values.
        let colors = [];
        // Array of all sizes.
        let sizes = [];

        // Variables for computing color values.
        let r, g, b;
        let tEff;

        // Split the data into lines.
        let lines = data.split("\n");

        // For every line.
        for (let i = 1; i < lines.length; i++) {
            // Split the line into its parts.
            let parts = lines[i].trim().split(",");

            ///////////////////////////
            // Calculate RGB-values. //
            ///////////////////////////

            // (BP-RP) gaia color index.
            const bp_rp = parseFloat(parts[4]);

            // Convert the gaia color index to the effective Temperature of
            // the star. This implements the equation introduced by 
            // Jordi et. al. (2010) https://arxiv.org/abs/1008.0815
            // As they state in their paper, this method only works for stars 
            // with a bp_rp color index < 1.5. For values greater 1.5, I used 
            // the same approach as GaiaSky 
            // https://zah.uni-heidelberg.de/gaia/outreach/gaiasky by using 
            // linear interpolation for mapping the index to a effective 
            // temperature. 
            if (bp_rp >= 1.5) {
                tEff = 3521.6 + ((3000 - 3521.6) / (15 - 1.5)) * (bp_rp - 1.5);
            } else {
                tEff = Math.pow(
                    10, 
                    3.999 - 
                    0.654 * bp_rp + 0.709 * Math.pow(bp_rp, 2) - 
                    0.316 * Math.pow(bp_rp, 3)
                );
            }
            tEff /= 100;

            // The effective color given in (1/100) Kelvin can be converted 
            // to rgb values. For this I used Tanner Helland's algorithm 
            // https://tannerhelland.com/2012/09/18/convert-temperature-rgb-algorithm-code.html
            // for converting Kelvin to rgb color values.

            // r
            if (tEff <= 66) {
                r = 255;
            } else {
                r = tEff - 60;
                r = 329.698727446 * Math.pow(r, -0.1332047592);
                if (r < 0) {
                    r = 0;
                } else if (r > 255) {
                    r = 255;
                }
            }

            // g
            if (tEff <= 66) {
                g = tEff;
                g = 99.4708025861 * Math.log(g) - 161.1195681661;
            } else {
                g = tEff - 60;
                g = 288.1221695283 * Math.pow(g, -0.0755148492);
            }
            if (g < 0) {
                g = 0;
            } else if (g > 255) {
                g = 255;
            }

            // b
            if (tEff >= 66) {
                b = 255;
            } else if (tEff <= 19) {
                b = 0;
            } else {
                b = tEff - 10;
                b = 138.5177312231 * Math.log(b) - 305.0447927307;
                if (b < 0) {
                    b = 0;
                } else if (b > 255) {
                    b = 255;
                }
            }

            // Add position values for the object, if there is information 
            // about its position in the gaia data. Missing position data
            // should be marked as "N/A" in the gaia data. If the data is
            // missing, we ignore the object. Else, we also add color and 
            // size values.
            if (
                parts.length == 10 
                && parts[7] != "N/A" 
                && parts[8] != "N/A" 
                && parts[9] != "N/A"
            ) {
                positions.push([
                    parseFloat(parts[7]),
                    parseFloat(parts[8]),
                    parseFloat(parts[9])
                ]);

                colors.push([r/255, g/255, b/255]);
                // In its current version, this function assigns the same
                // size to all objects. One could for example change this 
                // to size objects smaller the further they are away from 
                // the center.
                sizes.push(7);
            }
        
        }
        // Return the array of position, color and size values.
        return [positions, colors, sizes];
    }
}