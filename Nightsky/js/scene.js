function init() {
    var neededFiles = [
        './shader/idTexVS.glsl',
        './shader/idTexFS.glsl',
        './shader/shadowMapVS.glsl',
        './shader/shadowMapFS.glsl',
        './shader/renderVS.glsl',
        './shader/renderFS.glsl',
        './models/sphere.obj',
        './models/circle.obj',
        './models/cylinder.obj',
        './models/orbit.obj',
        './starData/TOP 10000 bright.csv with coordinates.csv.csv'
    ];
    loadResources(neededFiles);
}

var dt;    
var prevFrameTime;
var currFrameTime;
var load = [true, -1];
var gaia;
var sun;
var objectsWithShadows = [];
var backgroundObjects = [];
var clickableObjects = [];
var connectors = [];
var orbits = [];
var objectsToRender = [];
var models;
var materials = {
    amb:    new Material(1,0,0,0),
    all:    new Material(1,1,0.1,40)
};
var cam = new ControllableCamera(
    getCanvas(),
    [0,2000,10000],
    [0,500,-500],
    [0,1,0]
);
function main() {
    loadPrograms(
        getDataMap('./shader/idTexVS.glsl'),
        getDataMap('./shader/shadowMapVS.glsl'),
        getDataMap('./shader/renderVS.glsl'),
        getDataMap('./shader/idTexFS.glsl'),
        getDataMap('./shader/shadowMapFS.glsl'),
        getDataMap('./shader/renderFS.glsl')
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
    models = {
        sphere:     new Model(gl, 'sphere.obj'),
        circle:     new Model(gl, 'circle.obj'),
        cylinder:   new Model(gl, 'cylinder.obj'),
        orbit:      new Model(gl, 'orbit.obj')    
    };
    sunSystem();
}

function sunSystem() {
    var earthRad = 10;
    sun = new Star(
        gl, 
        models.sphere, 
        [600,600,600], 
        materials.amb, 
        [[0.96, 0.95, 0.77],[0,0,0],[0,0,0]]
    );
    // merkur
    sun.addObject(
        models.sphere,
        [0,0,1300],
        [2 * earthRad,2 * earthRad,2 * earthRad],
        materials.all,
        [[0.38, 0.21, 0.03],[0.86, 0.65, 0.43],[0.96, 0.95, 0.77]]
    );
    // venus
    sun.addObject(
        models.sphere,
        [0,0,1700],
        [4.5 * earthRad,4.5 * earthRad,4.5 * earthRad],
        materials.all,
        [[0.58, 0.20, 0.04],[0.91, 0.65, 0.24],[0.96, 0.95, 0.77]]
    );
    // erde
    sun.addObject(
        models.sphere,
        [0,0,2100],
        [5 * earthRad,5 * earthRad,5 * earthRad],
        materials.all,
        [[0.04, 0.24, 0.26],[0.42, 0.77, 0.81],[0.96, 0.95, 0.77]]
    );
    // mars
    sun.addObject(
        models.sphere,
        [0,0,2500],
        [2.5 * earthRad,2.5 * earthRad,2.5 * earthRad],
        materials.all,
        [[0.29, 0.13, 0.15],[0.91, 0.50, 0.24],[0.96, 0.95, 0.77]]
    );
    // jupiter
    sun.addObject(
        models.sphere,
        [0,0,3100],
        [28 * earthRad,28 * earthRad,28 * earthRad],
        materials.all,
        [[0.37, 0.20, 0.09],[0.88, 0.56, 0.25],[0.96, 0.95, 0.77]]
    );
    // saturn
    sun.addObject(
        models.sphere,
        [0,0,3700],
        [9.4 * earthRad,9.4 * earthRad,9.4 * earthRad],
        materials.all,
        [[0.43, 0.38, 0.28],[0.87, 0.72, 0.44],[0.96, 0.95, 0.77]]
    );
    // uranus
    sun.addObject(
        models.sphere,
        [0,0,4100],
        [5 * earthRad,5 * earthRad,5 * earthRad],
        materials.all,
        [[0.04, 0.25, 0.33],[0.55, 0.81, 0.82],[0.96, 0.95, 0.77]]
    );
    // neptun
    sun.addObject(
        models.sphere,
        [0,0,4500],
        [18.9 * earthRad,18.9 * earthRad,18.9 * earthRad],
        materials.all,
        [[0.11, 0.37, 0.66],[0.74, 0.88, 0.95],[0.96, 0.95, 0.77]]
    );
    objectsWithShadows = sun.getObjectsToRender();
    for (var i = 1; i < objectsWithShadows.length; i++) {
        orbits.push(new Orbit(
            gl, 
            models.orbit, 
            objectsWithShadows[i], 
            materials.amb
        ));
    }
    var position;
    var direction;
    for (var i = 0; i < gaia[0].length; i++) {
        position = vec3.clone(gaia[0][i]);
        direction = vec3.clone(position);
        vec3.normalize(direction, direction);
        vec3.scale(direction, direction, 10000);
        vec3.scale(position, position, 500);
        vec3.add(position, position, direction);
        backgroundObjects.push(new BackgroundStar(
            gl,
            i,
            cam,
            models.circle,
            position,
            [50,50,50],
            materials.amb,
            [gaia[1][i],[0,0,0],[0,0,0]]
        ));
    }
    start();
    load[0] = true;
    dt = 0;
    prevFrameTime = 0;
    currFrameTime = 0;
    requestAnimationFrame(draw);
}

function draw() {
    currFrameTime = performance.now();
    dt = performance.now() - prevFrameTime;
    prevFrameTime = currFrameTime;
    cam.update(dt);
    sun.update(dt, 1);
    clickableObjects = [];
    objectsToRender = sun.getObjectsToRender().concat(orbits).concat(connectors);
    var position = vec3.create();
    for (var i = 0; i < backgroundObjects.length; i++) {
        vec3.sub(
            position,
            backgroundObjects[i].position,
            cam.pos
        );
        
        if (vec3.angle(cam.forward, position) < 45 * Math.PI / 180) {
            objectsToRender.push(backgroundObjects[i]);
            clickableObjects.push(backgroundObjects[i]);
        }
    }
    genIdMap(clickableObjects, cam);
    genShadowMap(objectsWithShadows);
    render(objectsWithShadows, objectsToRender, cam);
    //next loop
    if (load[0]) {
        requestAnimationFrame(draw);
    } else {
        starSystem(load[1]);
    }
}

function starSystem(index) {
    connectors = [];
    orbits = [];
    backgroundObjects = [];
    if (index == gaia[0].length) {
        sunSystem();
        return;
    }
    sun = new Star(
    gl, 
    models.sphere, 
    [600,600,600], 
    materials.amb, 
    [gaia[1][index],[1,1,1],[1,1,1]]
    );
    var nObjs = Math.round(Math.random() * 10) + 2;
    var color;
    var pos;
    var size;
    for (var i = 0; i < nObjs; i++) {
        size = Math.random() * 200 + 25;
        color = [
            [Math.max(Math.random(),0.25), 
            Math.max(Math.random(),0.25), 
            Math.max(Math.random(),0.25)],
            [Math.max(Math.random(),0.25), 
            Math.max(Math.random(),0.25), 
            Math.max(Math.random(),0.25)],
            gaia[1][index]
        ];
        pos = Math.random() * 100 + 1200 + i * 600;
        sun.addObject(
            models.sphere, 
            [0,0,pos],
            [size,size,size],
            materials.all,
            color
        );
    }
    objectsWithShadows = sun.getObjectsToRender();
    for (var i = 1; i < objectsWithShadows.length; i++) {
        orbits.push(new Orbit(
            gl, 
            models.orbit, 
            objectsWithShadows[i], 
            materials.amb
        ));
    }
    var position0 = vec3.clone(gaia[0][index]);
    var position;
    var direction;
    for (var i = 0; i < gaia[0].length; i++) {
        if (i != index) {
            position = vec3.clone(gaia[0][i]);
            vec3.sub(position, position, position0);
            direction = vec3.clone(position);
            vec3.normalize(direction, direction);
            vec3.scale(direction, direction, 10000);
            vec3.scale(position, position, 500);
            vec3.add(position, position, direction);
            backgroundObjects.push(new BackgroundStar(
                gl,
                i,
                cam,
                models.circle,
                position,
                [50,50,50],
                materials.amb,
                [gaia[1][i],[0,0,0],[0,0,0]]
            ));
        }
    }
    vec3.scale(position0, position0, -1);
    direction = vec3.clone(position0);
    vec3.normalize(direction, direction);
    vec3.scale(direction, direction, 10000);
    vec3.scale(position0, position0, 500);
    vec3.add(position0, position0, direction);
    backgroundObjects.push(new BackgroundStar(
        gl, 
        gaia[0].length,
        cam,
        models.circle,
        position0,
        [50,50,50],
        materials.amb,
        [[0,1,0],[0,0,0],[0,0,0]]
    ));
    load[0] = true;
    dt = 0;
    prevFrameTime = 0;
    currFrameTime = 0;
    requestAnimationFrame(draw);

}

function loading(index) {
    load = [false, index];
}

var star1 = null;
function addConnector(star) {
    if (star1 == null) {
        star1 = star;
    } else if (star1 != star) {
        connectors.push(new Connector(
            gl, 
            models.cylinder, 
            star1, 
            star, 
            materials.amb
        ));
        star1 = null;
    }
}
//end