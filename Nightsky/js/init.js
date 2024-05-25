/**
* This initial function is called on startup.
* It loads needed text and image files and calls the function main() 
* afterwards.
*/
function init() {
    // The list of needed text files.
    // New files can be added here if needed.
    const neededTextFiles = [
        './shader/idTexVS.glsl',
        './shader/idTexFS.glsl',
        './shader/shadowMapVS.glsl',
        './shader/shadowMapFS.glsl',
        './shader/renderSolidVS.glsl',
        './shader/renderSolidFS.glsl',
        './shader/renderShadedVS.glsl',
        './shader/renderShadedFS.glsl',
        './models/sphere.obj',
        './models/circle.obj',
        './models/cylinder.obj',
        './models/orbit.obj',
        './starData/TOP 10000 bright.csv with coordinates.csv.csv',
        './starData/joined_distance_pc_xyz.csv',
        './starData/conns_HIP.csv',
        './starData/stars(1).csv'
    ];
    // The list of needed image files.
    // New files can be added here if needed.
    const neededImageFiles = [
        './textures/lavaRock1.png',
        './textures/lavaRock2.png',
        './textures/ice1.png',
        './textures/ice2.png',
        './textures/iceAndWater1.png',
        './textures/iceAndWater2.png',
        './textures/gasGiant01.png',
        './textures/gasGiant02.png',
        './textures/gasGiant03.png',
        './textures/gasGiant04.png',
        './textures/gasGiant05.png',
        './textures/gasGiant06.png',
        './textures/gasGiant07.png',
        './textures/gasGiant08.png',
        './textures/gasGiant09.png',
        './textures/gasGiant10.png',
        './textures/gasGiant11.png',
        './textures/gasGiant12.png',
        './textures/gasGiant13.png',
        './textures/gasGiant14.png',
        './textures/gasGiant15.png'
    ];
    // This function is defined in load.js. It loads the files specified by 
    // the lists of needed text and image files. After loading the files, 
    // this function calls the function main(). 
    loadResources(neededTextFiles, neededImageFiles, main);
}
/**
 * This function loads the shader programs, models, textures, gaia and starsign
 * data from the loaded text and image files. It also calls startScene() in 
 * scene.js. This will build the scene and start rendering.
 */
function main() {
    // Load the shader programs. This function is defined in render.js.
    loadPrograms(
        getDataMap('./shader/idTexVS.glsl'),
        getDataMap('./shader/shadowMapVS.glsl'),
        getDataMap('./shader/renderSolidVS.glsl'),
        getDataMap('./shader/renderShadedVS.glsl'), // getDataMap() is defined
                                                    // in load.js.
        getDataMap('./shader/idTexFS.glsl'),
        getDataMap('./shader/shadowMapFS.glsl'),
        getDataMap('./shader/renderSolidFS.glsl'),
        getDataMap('./shader/renderShadedFS.glsl')
    );
    // Load the models. addModelFromPath() is defined in model.js.
    addModelFromPath('sphere', './models/sphere.obj');
    addModelFromPath('circle', './models/circle.obj');
    addModelFromPath('cylinder', './models/cylinder.obj');
    addModelFromPath('orbit', './models/orbit.obj');
    // Load the textures. addTextureFromPath() is defined in texture.js.
    addTextureFromPath('lavaRock1', './textures/lavaRock1.png');
    addTextureFromPath('lavaRock2', './textures/lavaRock2.png');
    addTextureFromPath('ice1', './textures/ice1.png');
    addTextureFromPath('ice2', './textures/ice2.png');
    addTextureFromPath('iceAndWater1', './textures/iceAndWater1.png');
    addTextureFromPath('iceAndWater2', './textures/iceAndWater2.png');
    addTextureFromPath('gasGiant01', './textures/gasGiant01.png');
    addTextureFromPath('gasGiant02', './textures/gasGiant02.png');
    addTextureFromPath('gasGiant03', './textures/gasGiant03.png');
    addTextureFromPath('gasGiant04', './textures/gasGiant04.png');
    addTextureFromPath('gasGiant05', './textures/gasGiant05.png');
    addTextureFromPath('gasGiant06', './textures/gasGiant06.png');
    addTextureFromPath('gasGiant07', './textures/gasGiant07.png');
    addTextureFromPath('gasGiant08', './textures/gasGiant08.png');
    addTextureFromPath('gasGiant09', './textures/gasGiant09.png');
    addTextureFromPath('gasGiant10', './textures/gasGiant10.png');
    addTextureFromPath('gasGiant11', './textures/gasGiant11.png');
    addTextureFromPath('gasGiant12', './textures/gasGiant12.png');
    addTextureFromPath('gasGiant13', './textures/gasGiant13.png');
    addTextureFromPath('gasGiant14', './textures/gasGiant14.png');
    addTextureFromPath('gasGiant15', './textures/gasGiant15.png');
    // Get gaia data. parseStarData() is defined in load.js. It returns the 
    // gaia data in form of an array [positions, colors, sizes], where 
    // positions, colors and sizes are arrays as well.
    const gaia = parseStarData(getDataMap(
        './starData/TOP 10000 bright.csv with coordinates.csv.csv'
    ));
    // Get starsign data. parseStarSignData() is defined in load.js. 
    // It returns the starsign data in form of an array 
    // [stars, sings, sizes]. stars is an array. Each entry consists 
    // of a HIP and the position of a star. sings is a map. The keys 
    // are the abbreviation of the different starsigns and the values
    //  are the HIPs of the stars in the starsign.
    const starSigns = parseStarSignData(
        getDataMap('./starData/stars(1).csv'),  // Data of the stars .
        getDataMap('./starData/conns_HIP.csv')  // Data of the connections.
    );
    const stars = starSigns[0];
    const signs = starSigns[1];
    const starMap = starSigns[2];
    // Variables needed inside the for loops.
    let index;
    let signsList;
    let indexList;
    // Add the starsign data to the gaia data and swap the HIPs 
    // for the indices in the gaia data.
    for (let i = 0; i < stars.length; i++) {
        // The new index to be swaped with the HIP.
        index = gaia[0].length;
        // Add the i-th star to the gaia data.
        gaia[0].push(stars[i][1]);
        gaia[1].push([0.4, 0.1, 0.9]);
        gaia[2].push(5);
        // Get all the starsigns with the i-th star.
        signsList = starMap.get(stars[i][0]);
        for (let j = 0; j < signsList.length; j++) {
            // Get the list of HIPs in the j-th starsign.
            indexList = signs.get(signsList[j]);
            // Swap the HIP of the i-th star to the index.
            for (let k = 0; k < indexList.length; k++) {
                if (indexList[k] == stars[i][0]) {
                    indexList[k] = index;
                }
            }
        }
    }
    // Add our sun to the gaia data.
    gaia[0].push([0, 0, 0]);
    gaia[1].push([0,1, 0]);
    gaia[2].push(5);
    // this function builds the scene and starts the render. It is defined
    // in scene.js.
    startScene(gaia, signs);
    // List of all the starsign abbreviations.
    const nameList = [];
    // Add the abbreviations.
    signs.forEach((val, key) => {
        nameList.push(key);
    });
    // Use the list of abbreviations to set the list of starsigns in the ui.
    // starSignList() is defined in ui.js.
    starSignList(nameList);
}