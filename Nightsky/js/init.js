/**
* This initial function is called on startup.
* It loads needed text and image files.
*/
function init() {
    let neededTextFiles = [
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
    let neededImageFiles = [
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
    //loads the files and calls main() afterwards
    loadResources(neededTextFiles, neededImageFiles, main);
}

function main() {
    loadPrograms(
        getDataMap('./shader/idTexVS.glsl'),
        getDataMap('./shader/shadowMapVS.glsl'),
        getDataMap('./shader/renderSolidVS.glsl'),
        getDataMap('./shader/renderShadedVS.glsl'),
        getDataMap('./shader/idTexFS.glsl'),
        getDataMap('./shader/shadowMapFS.glsl'),
        getDataMap('./shader/renderSolidFS.glsl'),
        getDataMap('./shader/renderShadedFS.glsl')
    );
    addModelFromPath('sphere', './models/sphere.obj');
    addModelFromPath('circle', './models/circle.obj');
    addModelFromPath('cylinder', './models/cylinder.obj');
    addModelFromPath('orbit', './models/orbit.obj');

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

    const gaia = parseStarData(getDataMap(
        './starData/TOP 10000 bright.csv with coordinates.csv.csv'
    ));
    const starSigns = parseStarSignData(
        getDataMap('./starData/stars(1).csv'),
        getDataMap('./starData/conns_HIP.csv')
    );

    const stars = starSigns[0];
    const signs = starSigns[1];
    const starMap = starSigns[2];

    for (let i = 0; i < stars.length; i++) {
        const index = gaia[0].length;
        gaia[0].push(stars[i][1]);
        gaia[1].push([0.4, 0.1, 0.9,1]);
        gaia[2].push(5);
        const signsList = starMap.get(stars[i][0]);
        for (let j = 0; j < signsList.length; j++) {
            const indexList = signs.get(signsList[j]);
            for (let k = 0; k < indexList.length; k++) {
                if (indexList[k] == stars[i][0]) {
                    indexList[k] = index;
                }
            }
        }
    }
    gaia[0].push([0, 0, 0]);
    gaia[1].push([1,.5, 1, 1]);
    gaia[2].push(5);
    startScene(gaia, signs);
    const nameList = [];
    signs.forEach((val, key) => {
        nameList.push(key);
    });
    starSignList(nameList);
}
