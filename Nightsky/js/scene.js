/** @type {WebGLRenderingContext} */
var gl = canvasGl.getContext('webgl');
function init() {
    var neededTextFiles = [
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
        './starData/conns_HIP.csv'
    ];
    var neededImageFiles = [
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
    loadResources(neededTextFiles, neededImageFiles);
}

var pause = false;
var camUpdate = true;
var clickable = true;
var showConnections = true;
var started = false;
var dt = 0;    
var prevFrameTime = 0;
var currFrameTime = 0;
var gaia;
var sun;
var shadedObjects = [];
var backgroundObjects = [];
var clickableObjects = [];
var connectors = [];
var connectedObjects = new Map();
var orbits = [];
var models;
var textures;
var materials = {
    amb:    new Material(1,0,0,0),
    all:    new Material(.1,1,.2,40)
};
var cam = new ControllableCamera(
    getCanvas(),
    [0,200,-200],
    [0,0,100],
    [0,1,0],
    45*Math.PI/180
);
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
    setModelDataMap(
        'sphere.obj', 
        parseModelData(getDataMap('./models/sphere.obj'))
    );
    setModelDataMap(
        'circle.obj', 
        parseModelData(getDataMap('./models/circle.obj'))
    );
    setModelDataMap(
        'cylinder.obj', 
        parseModelData(getDataMap('./models/cylinder.obj'))
    );
    setModelDataMap(
        'orbit.obj', 
        parseModelData(getDataMap('./models/orbit.obj',))
    );
    gaia = parseStarData(getDataMap(
            './starData/TOP 10000 bright.csv with coordinates.csv.csv'
    ));
    //sun
    gaia[0].push([0,0,0]);
    gaia[1].push([1,0,0]);
    gaia[2].push(5);
    starSigns = parseStarSignData(
        getDataMap('./starData/joined_distance_pc_xyz.csv'),
        getDataMap('./starData/conns_HIP.csv')
    );
    models = {
        sphere:     new Model(gl, 'sphere.obj'),
        circle:     new Model(gl, 'circle.obj'),
        cylinder:   new Model(gl, 'cylinder.obj'),
        orbit:      new Model(gl, 'orbit.obj')    
    };
    updateModelAndMaterial(models, materials);
    textures = [
        getDataMap('./textures/lavaRock1.png'),
        getDataMap('./textures/lavaRock2.png'),
        getDataMap('./textures/ice1.png'),
        getDataMap('./textures/ice2.png'),
        getDataMap('./textures/iceAndWater1.png'),
        getDataMap('./textures/iceAndWater2.png'),
        getDataMap('./textures/gasGiant01.png'),
        getDataMap('./textures/gasGiant02.png'),
        getDataMap('./textures/gasGiant03.png'),
        getDataMap('./textures/gasGiant04.png'),
        getDataMap('./textures/gasGiant05.png'),
        getDataMap('./textures/gasGiant06.png'),
        getDataMap('./textures/gasGiant07.png'),
        getDataMap('./textures/gasGiant08.png'),
        getDataMap('./textures/gasGiant09.png'),
        getDataMap('./textures/gasGiant10.png'),
        getDataMap('./textures/gasGiant11.png'),
        getDataMap('./textures/gasGiant12.png'),
        getDataMap('./textures/gasGiant13.png'),
        getDataMap('./textures/gasGiant14.png'),
        getDataMap('./textures/gasGiant15.png')
    ];
    sunSystem();
}

function randTexture() {
    return textures[Math.floor(Math.random()*textures.length)];
}

function sunSystem() {
    backgroundObjects = [];
    connectors = [];
    sun = new Star(
        gl,
        gaia[0].length-1,
        models.sphere,
        randTexture(),
        [60,60,60],
        materials.amb,
        [[0.96,0.95,0.77],[0,0,0],[0,0,0],1]
    );
    //merkur
    sun.addObject(
        models.sphere,
        randTexture(),
        [0,0,130],
        [2.4,2.4,2.4],
        materials.all,
        [[0.38, 0.21, 0.03],[0.86, 0.65, 0.43],[0.96, 0.95, 0.77],1],
        0,0,0
    );
    // venus
    sun.addObject(
        models.sphere,
        randTexture(), 
        [0,0,170],
        [6,6,6],
        materials.all,
        [[0.58, 0.20, 0.04],[0.91, 0.65, 0.24],[0.96, 0.95, 0.77],1],
        0,0,0
    );
    //erde
    sun.addObject(
        models.sphere,
        randTexture(), 
        [0,0,210],
        [6.3,6.3,6.3],
        materials.all,
        [[0.04, 0.24, 0.26],[0.42, 0.77, 0.81],[0.96, 0.95, 0.77],1],
        0,0,0
    );
    //mond
    sun.objects[sun.objects.length-1].addObject(
        models.sphere,
        randTexture(), 
        [0,0,-10],
        [2,2,2],
        materials.all,
        [[0.04, 0.24, 0.26],[0.42, 0.77, 0.81],[0.96, 0.95, 0.77],1],
        40,0,30
    );
    // mars
    sun.addObject(
        models.sphere,
        randTexture(), 
        [0,0,250],
        [3.3,3.3,3.3],
        materials.all,
        [[0.29, 0.13, 0.15],[0.91, 0.50, 0.24],[0.96, 0.95, 0.77],1],
        0,0,0
    );
    // jupiter
    sun.addObject(
        models.sphere,
        randTexture(), 
        [0,0,310],
        [20,20,20],
        materials.all,
        [[1,1,1],[1,1,1],[1,1,1],1],
        0,0,0
    );
    // saturn
    sun.addObject(
        models.sphere,
        randTexture(), 
        [0,0,370],
        [18,18,18],
        materials.all,
        [[0.43, 0.38, 0.28],[0.87, 0.72, 0.44],[0.96, 0.95, 0.77],1],
        0,0,0
    );
    // uranus
    sun.addObject(
        models.sphere,
        randTexture(), 
        [0,0,410],
        [9,9,9],
        materials.all,
        [[0.04, 0.25, 0.33],[0.55, 0.81, 0.82],[0.96, 0.95, 0.77],1],
        0,0,0
    );
    // neptun
    sun.addObject(
        models.sphere,
        randTexture(), 
        [0,0,450],
        [8.5,8.5,8.5],
        materials.all,
        [[0.11, 0.37, 0.66],[0.74, 0.88, 0.95],[0.96, 0.95, 0.77],1],
        0,0,0
    );
    shadedObjects = sun.getObjectsToRender()[0];
    orbits = sun.getObjectsToRender()[1];

    var position;
    var direction;
    for (var i = 0; i < gaia[0].length-1; i++) {
        position = vec3.clone(gaia[0][i]);
        direction = vec3.clone(position);
        vec3.normalize(direction, direction);
        vec3.scale(direction, direction, 1000);
        vec3.scale(position, position, 50);
        vec3.add(position, position, direction);
        backgroundObjects.push(new BackgroundStar(
            gl,
            i,
            cam,
            models.circle,
            null,
            position,
            [gaia[2][i], gaia[2][i], gaia[2][i]],
            materials.amb,
            [
                [gaia[1][i][0], gaia[1][i][1], gaia[1][i][2]],
                [0,0,0],
                [0,0,0],
                gaia[1][i][3]
            ]
        ));
    }
    var conMap = new Map(connectedObjects);
    connectedObjects = new Map();
    for (var [star1, stars] of conMap.entries()) {
        for (var i = 0; i < stars.length; i++) {
            if (star1 != sun.index && stars[i] != sun.index) {
                addConnector(star1);
                addConnector(stars[i]);
            } else if (connectedObjects.get(star1) === undefined) {
                connectedObjects.set(star1, [stars[i]]);
            } else {
                connectedObjects.get(star1).push(stars[i]);
            }
        }
    }
    if (!started) {
        start();
        started = true;
        requestAnimationFrame(draw);
    }
}

function draw() {
    dt = performance.now() - prevFrameTime;
    prevFrameTime = currFrameTime;
    currFrameTime = performance.now();
    
    if (camUpdate) {
        cam.update(dt);
    }
    if (!pause) {
        sun.update(dt, getSpeed());
    }
    
    clickableObjects = [];
    if (showConnections) {
        solidObjects = [].concat(orbits).concat(connectors);
    } else {
        solidObjects = [].concat(orbits);
    }
    
    var position = vec3.create();
    for (var i = 0; i < backgroundObjects.length; i++) {
        vec3.sub(
            position,
            backgroundObjects[i].position,
            cam.position
        );
        
        if (vec3.angle(cam.z, position) < 45 * Math.PI / 180) {
            solidObjects.push(backgroundObjects[i]);
        }
    }
    if (shadedObjects.length > 0) {
        genShadowMap(shadedObjects);
    }
    clickableObjects = [].concat(shadedObjects).concat(solidObjects);
    if (solidObjects.length + shadedObjects.length > 0) {
        render(solidObjects, shadedObjects, cam, sun.position);
    }
    if (clickable) {
        genIdMap(clickableObjects, cam);
    }
    requestAnimationFrame(draw);
}

function getConnectedObjects() {
    return connectedObjects;
}

var star1 = null;
function addConnector(index) {
    var s;
    if (index > sun.index) {
        s = backgroundObjects[index-1];
    } else {
        s = backgroundObjects[index];
    }
    if (star1 == null) {
        star1 = s;
        return;
    } else if ((connectedObjects.get(star1.index) !== undefined && 
    connectedObjects.get(star1.index).indexOf(s.index) != -1) 
    || 
    (connectedObjects.get(s.index) !== undefined && 
    connectedObjects.get(s.index).indexOf(star1.index)!= -1)) 
    {
        star1 = null;
        return;
    } else if (connectedObjects.get(star1.index) !== undefined) {
        connectedObjects.get(star1.index).push(s.index);
    } else {
        connectedObjects.set(star1.index, [s.index]); 
    }
    connectors.push(new Connector(
        gl, 
        models.cylinder, 
        star1, 
        s, 
        materials.amb
    ));
    star1 = null;
}

function removeConnector(c) {
    if (connectedObjects.get(c.star1.index) !== undefined) {
        if (connectedObjects.get(c.star1.index).indexOf(c.star2.index) != -1) {
            connectedObjects.get(c.star1.index).splice(
                connectedObjects.get(c.star1.index).indexOf(c.star2.index),
                1
            );
        }
    }
    if (connectedObjects.get(c.star2.index) !== undefined) {
        if (connectedObjects.get(c.star2.index).indexOf(c.star1.index) != -1) {
            connectedObjects.get(c.star2.index).splice(
                connectedObjects.get(c.star2.index).indexOf(c.star1.index),
                1
            );
        }
    }
    connectors.splice(connectors.indexOf(c),1);
}

async function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

async function swapStar(index) {
    if (index > sun.index) {  
        var newStar = backgroundObjects[index-1];
    } else {  
        var newStar = backgroundObjects[index];
    }
    var tex = randTexture();
    newStar.updateTexture(tex);
    camUpdate = false;
    clickable = false;
    showConnections = false;
    var relPosition = vec3.create();
    vec3.sub(relPosition, newStar.position, cam.position);
    vec3.normalize(relPosition, relPosition);
    var angle = vec3.angle(relPosition, cam.z)/10;
    var axis = vec3.create();
    var rotMat = mat4.create();
    var loop = true;
    while (loop && angle > 0.001 * Math.PI / 180) {
        angle = vec3.angle(relPosition, cam.z)/10;
        vec3.cross(axis, cam.z, relPosition);
        mat4.fromRotation(rotMat, angle, axis);
        vec3.transformMat4(cam.z, cam.z, rotMat);
        await sleep(10);
    }
    while (cam.angle > 0.001 * Math.PI / 180) {
        cam.angle *= 0.85;
        await sleep(10);
    }
    cam.finalize();
    cam = new ControllableCamera(
        getCanvas(),
        [0,200,-200],
        [0,0,1],
        [0,1,0],
        0.001*Math.PI/180
    );
    if (index == gaia[0].length-1) {
        sunSystem();
        sun.updateTexture(tex);
    } else {
        sun = new Star(
            gl, 
            index, 
            models.sphere, 
            tex,
            [60,60,60],
            materials.amb,
            [newStar.ambColor,newStar.difColor,newStar.speColor,1]
        );
        var amount = Math.round(Math.random() * 5) + 3;
        var minDist = 130;
        var dist;
        var scale;
        for (var i = 0; i < amount; i++) {
            dist = Math.random() * 50 + minDist * (i+1);
            scale = Math.random() * 30 + 10;
            sun.addObject(
                models.sphere,
                randTexture(),
                [0,0,dist],
                [scale,scale,scale],
                materials.all,
                [
                    [Math.random(),Math.random(),Math.random()],
                    [Math.random(),Math.random(),Math.random()],
                    [Math.random(),Math.random(),Math.random()],
                    1
                ],
                Math.random() * 10 * Math.pow(-1,Math.round(Math.random())),
                Math.random() * 10 * Math.pow(-1,Math.round(Math.random())),
                Math.random() * 10 * Math.pow(-1,Math.round(Math.random()))
            )
        }
        shadedObjects = sun.getObjectsToRender()[0];
        orbits = sun.getObjectsToRender()[1];
        backgroundObjects = [];
        connectors = [];
        var origin = vec3.clone(gaia[0][index]);
        var position;
        var direction;
        for (var i = 0; i < gaia[0].length; i++) {
            if(i != index) {
                position = vec3.clone(gaia[0][i]);
                vec3.sub(position, position, origin);
                direction = vec3.clone(position);
                vec3.normalize(direction, direction);
                vec3.scale(direction, direction, 1000);
                vec3.scale(position, position, 50);
                vec3.add(position, position, direction);
                backgroundObjects.push(new BackgroundStar(
                    gl,
                    i,
                    cam,
                    models.circle,
                    null,
                    position,
                    [gaia[2][i],gaia[2][i],gaia[2][i]],
                    materials.amb,
                    [
                        [gaia[1][i][0], gaia[1][i][1], gaia[1][i][2]],
                        [0,0,0],
                        [0,0,0],
                        gaia[1][i][3]
                    ]
                ));
            }
        }
        var conMap = new Map(connectedObjects);
        connectedObjects = new Map();
        for (var [star1, stars] of conMap.entries()) {
            for (var i = 0; i < stars.length; i++) {
                if (star1 != index && stars[i] != index) {
                    addConnector(star1);
                    addConnector(stars[i]);
                } else if (connectedObjects.get(star1) === undefined) {
                    connectedObjects.set(star1, [stars[i]]);
                } else {
                    connectedObjects.get(star1).push(stars[i]);
                }
            }
        }
    }
    cam.angle = 0.001*Math.PI/180;
    while (cam.angle < 45 * Math.PI / 180) {
        cam.angle *= 1.15;
        await sleep(10);
    }
    cam.angle = 45 * Math.PI / 180;
    camUpdate = true;
    clickable = true;
    showConnections = true;
}

function getSun() {
    return sun;
}
function getGaia() {
    return gaia;
}
//end
