function init() {
    var neededFiles = [
        './shader/shadowMapVS.glsl',
        './shader/shadowMapFS.glsl',
        './shader/renderVS.glsl',
        './shader/renderFS.glsl',
        './models/sphere.obj',
        './models/circle.obj',
        './models/connector.obj',
        './starData/TOP 100000 bright.csv with coordinates.csv.csv'
    ];
    loadResources(neededFiles);
}

function main() {
    loadPrograms(
        getDataMap('./shader/shadowMapVS.glsl'),
        getDataMap('./shader/renderVS.glsl'),
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
        'connector.obj', 
        parseModelData(getDataMap('./models/connector.obj'))
    );
    var gaia = parseStarData(getDataMap(
            './starData/TOP 100000 bright.csv with coordinates.csv.csv'
    ));
    var models = {
        sun:        new Sphere(
                        gl,
                        [0.96, 0.95, 0.77],
                        [1,1,1],
                        [1,1,1],
                        1,1,1,1
                    ),
        merkur:     new Sphere(
                        gl,
                        [0.38, 0.21, 0.03],
                        [0.86, 0.65, 0.43],
                        [0.96, 0.95, 0.77],
                        1,1,0.1,40
                    ),
        venus:      new Sphere(
                        gl,
                        [0.58, 0.20, 0.04]
                        ,[0.91, 0.65, 0.24],
                        [0.96, 0.95, 0.77],
                        1,1,0.1,40
                    ),
        erde:       new Sphere(
                        gl,
                        [0.04, 0.24, 0.26],
                        [0.42, 0.77, 0.81],
                        [0.96, 0.95, 0.77],
                        1,1,0.1,40
                    ),
        mars:       new Sphere(
                        gl,
                        [0.29, 0.13, 0.15],
                        [0.91, 0.50, 0.24],
                        [0.96, 0.95, 0.77],
                        1,1,0.1,40
                    ),
        jupiter:    new Sphere(
                        gl,
                        [0.37, 0.20, 0.09],
                        [0.88, 0.56, 0.25],
                        [0.96, 0.95, 0.77],
                        1,1,0.1,40
                    ),
        saturn:     new Sphere(
                        gl,
                        [0.43, 0.38, 0.28],
                        [0.87, 0.72, 0.44],
                        [0.96, 0.95, 0.77],
                        1,1,0.1,40
                    ),
        uranus:     new Sphere(
                        gl,
                        [0.04, 0.25, 0.33],
                        [0.55, 0.81, 0.82],
                        [0.96, 0.95, 0.77],
                        1,1,0.1,40
                    ),
        neptun:     new Sphere(
                        gl,
                        [0.11, 0.37, 0.66],
                        [0.74, 0.88, 0.95],
                        [0.96, 0.95, 0.77],
                        1,1,0.1,40
                    ),
        background: new Circle(
                        gl,
                        [1,1,1],
                        [1,1,1],
                        [1,1,1],
                        1,0,0,0
                    )
    };
    //controllable camera
    var cam = new ControllableCamera(
        getCanvas(),
        vec3.fromValues(0,2000,10000),
        vec3.fromValues(0,500,-500),
        vec3.fromValues(0,1,0)
    );
    var earthRad = 10;
    var earthMass = 1000;
    var sun = new Star(gl, models.sun, 600, 6e14);
    sun.addObject(
        models.merkur, 
        [0,0,1300], 
        [5.6,0,0], 
        2 * earthRad, 
        0.06 * earthMass
    );
    sun.addObject(
        models.venus, 
        [0,0,1700], 
        [4.8,0,0], 
        4.5 * earthRad, 
        0.82 * earthMass
    );
    sun.addObject(
        models.erde,
        [0,0,2100], 
        [4.35,0,0], 
        5 * earthRad, 
        earthMass
    );
    sun.addObject(
        models.mars, 
        [0,0,2500], 
        [4,0,0], 
        2.5 * earthRad,
        0.11 * earthMass
    );
    sun.addObject(
        models.jupiter, 
        [0,0,3100], 
        [3.59,0,0], 
        28 * earthRad, 
        317.8 * earthMass
    );
    sun.addObject(
        models.saturn, 
        [0,0,3700], 
        [3.31,0,0], 
        9.4 * earthRad, 
        95.16 * earthMass
    );
    sun.addObject(
        models.uranus, 
        [0,0,4100], 
        [3.13,0,0],
        5 * earthRad, 
        14.54 * earthMass
    );
    sun.addObject(
        models.neptun, 
        [0,0,4500], 
        [2.985,0,0], 
        18.9 * earthRad, 
        17.15 * earthMass
    );
    var objectsWithShadows = sun.getObjectsToRender();
    var objectsToRender = [];
    var objectsInTheBackground = [];
    var connectedObjects = [];
    var connectors = [];

    for (var i = 0; i < gaia[0].length; i++) {
        objectsInTheBackground.push(
            new BackgroundStar(
                gl, 
                cam, 
                gaia[0][i], 
                gaia[1][i], 
                Math.max(Math.min(1000 / gaia[2][i], 100), 1)
            )
        );
    }

    //test for connecting stars
    for (var i = 0; i < 4; i++) {
        connectedObjects.push(objectsInTheBackground[
            Math.round((objectsInTheBackground.length) * Math.random())
        ]);
    }
    for (var i = 0; i < connectedObjects.length-1; i++) {
        connectors.push(
            new Connector(gl, connectedObjects[i], connectedObjects[i+1])
        );
    }
    connectors.push(
        new Connector(
            gl, 
            connectedObjects[connectedObjects.length-1], 
            connectedObjects[0]
        )
    );
    
    //frametimes
    var dt = 0;
    var prevFrameTime = 0;
    var currFrameTime = 0;
    var forward = vec3.create();
    var camPosition = vec3.create();
    var position = vec3.create();
    start();
    requestAnimationFrame(draw);
    function draw() {
        // calculate delta-time and 
        // setting prev-/currFrameTime for the next draw-call
        currFrameTime = performance.now();
        dt = performance.now() - prevFrameTime;
        prevFrameTime = currFrameTime;
        //updating 
        cam.update(dt); 
        sun.update(1, 10);
        if (!vec3.equals(forward, cam.forward) 
            || !vec3.equals(camPosition, cam.pos)) 
        {
            forward = cam.forward;
            camPosition = cam.pos;
            objectsToRender = sun.getObjectsToRender();
            for (var i = 0; i < connectors.length; i++) {
                objectsToRender.push(connectors[i]);
            }
            for (var i = 0; i < objectsInTheBackground.length; i++) {
                vec3.sub(
                    position, 
                    objectsInTheBackground[i].position, 
                    cam.pos
                );
                if (vec3.angle(forward, position) < 30 * Math.PI / 180) {
                    objectsToRender.push(objectsInTheBackground[i]);
                }
            }
        }
        
        genShadowMap(objectsWithShadows);
        render(objectsWithShadows, objectsToRender, cam);
        //next looop
        requestAnimationFrame(draw);
    }
} //end

