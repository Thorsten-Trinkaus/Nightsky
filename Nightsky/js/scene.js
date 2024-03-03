{
    // variables needed for the scene
    /** @type {WebGLRenderingContext} */
    const gl = getCanvas().getContext('webgl');
    let camUpdate = true;       // can the camera be controlled?
    let clickable = true;       // can objects in the scene be clicked?
    let showConnections = true;     // visibility for the Connectors 
    let dt = 0;
    let prevFrameTime = 0;      
    let currFrameTime = 0;
    let gaia;
    let signs;
    let signsConnectors = [];
    let signsVisibility = new Map();
    let sun;
    let shadedObjects = [];
    let backgroundObjects = [];
    let clickableObjects = [];
    let connectedObjects = new Map();
    let connectors = [];
    let orbits = [];
    let cam = new ControllableCamera(
        getCanvas(),
        [0, 200, -200],
        [0, 0, 100],
        [0, 1, 0],
        45 * Math.PI / 180
    );

    function startScene(gaiaVal, signsVal) {
        gaia = gaiaVal;
        signs = signsVal;
        signs.forEach((val, key) => {
            signsVisibility.set(key, false);
        });
        sunSystem();
        swapCanvas();
        requestAnimationFrame(draw);
    }


    function sunSystem() {
        backgroundObjects = [];
        connectors = [];
        sun = new Star(
            gaia[0].length-1,
            getModel('sphere'),
            randTexture(),
            [60, 60, 60],
            basicMaterials.amb,
            [0.96, 0.95, 0.77],
            [0, 0, 0],
            [0, 0, 0],
            1
        );
        //merkur
        sun.addObject(
            getModel('sphere'),
            randTexture(),
            [0, 0, 130],
            [2.4, 2.4, 2.4],
            basicMaterials.all,
            [0.38, 0.21, 0.03],
            [0.86, 0.65, 0.43],
            [0.96, 0.95, 0.77],
            1,
            0, 0, 0,
            0, 0, 0
        ).addDynamicOrbit();
        // venus
        sun.addObject(
            getModel('sphere'),
            randTexture(), 
            [0, 0, 170],
            [6, 6, 6],
            basicMaterials.all,
            [0.58, 0.20, 0.04],
            [0.91, 0.65, 0.24],
            [0.96, 0.95, 0.77],
            1,
            0, 0, 0,
            0, 0, 0
        ).addDynamicOrbit();
        //erde
        sun.addObject(
            getModel('sphere'),
            randTexture(), 
            [0, 0, 210],
            [6.3, 6.3, 6.3],
            basicMaterials.all,
            [0.04, 0.24, 0.26],
            [0.42, 0.77, 0.81],
            [0.96, 0.95, 0.77],
            1,
            10, 0, 0,
            0, 0, 0
        ).addDynamicOrbit();
        //mond
        sun.objects[sun.objects.length-1].addObject(
            getModel('sphere'),
            randTexture(), 
            [0, 0, -10],
            [2, 2, 2],
            basicMaterials.all,
            [0.04, 0.24, 0.26],
            [0.42, 0.77, 0.81],
            [0.96, 0.95, 0.77],
            1,
            40, 0, 30,
            0, 0, 0
        ).addDynamicOrbit();
        // mars
        sun.addObject(
            getModel('sphere'),
            randTexture(), 
            [0, 0, 250],
            [3.3, 3.3, 3.3],
            basicMaterials.all,
            [0.29, 0.13, 0.15],
            [0.91, 0.50, 0.24],
            [0.96, 0.95, 0.77],
            1,
            0, 0, 0,
            0, 0, 0
        ).addDynamicOrbit();
        // jupiter
        sun.addObject(
            getModel('sphere'),
            randTexture(), 
            [0, 0, 310],
            [20, 20, 20],
            basicMaterials.all,
            [1,1,1],
            [1,1,1],
            [1,1,1],
            1,
            0, 0, 0,
            0, 0, 0
        ).addDynamicOrbit();
        // saturn
        sun.addObject(
            getModel('sphere'),
            randTexture(), 
            [0, 0, 370],
            [18, 18, 18],
            basicMaterials.all,
            [0.43, 0.38, 0.28],
            [0.87, 0.72, 0.44],
            [0.96, 0.95, 0.77],
            1,
            0, 0, 0,
            0, 0, 0
        ).addDynamicOrbit();
        // uranus
        sun.addObject(
            getModel('sphere'),
            randTexture(), 
            [0, 0, 410],
            [9, 9, 9],
            basicMaterials.all,
            [0.04, 0.25, 0.33],
            [0.55, 0.81, 0.82],
            [0.96, 0.95, 0.77],
            1,
            0, 0, 0,
            0, 0, 0
        ).addDynamicOrbit();
        // neptun
        sun.addObject(
            getModel('sphere'),
            randTexture(), 
            [0, 0, 450],
            [8.5, 8.5, 8.5],
            basicMaterials.all,
            [0.11, 0.37, 0.66],
            [0.74, 0.88, 0.95],
            [0.96, 0.95, 0.77],
            1,
            0, 0, 0,
            0, 0, 0
        ).addDynamicOrbit();
        shadedObjects = sun.getObjectsToRender()[0];
        orbits = sun.getObjectsToRender()[1];
        
        let position;
        let direction;
        for (let i = 0; i < gaia[0].length-1; i++) {
            position = vec3.clone(gaia[0][i]);
            direction = vec3.clone(position);
            vec3.normalize(direction, direction);
            vec3.scale(direction, direction, 100);
            vec3.add(position, position, direction);
            vec3.scale(position, position, 20);
            backgroundObjects.push(new BackgroundStar(
                i,
                cam,
                getModel('circle'),
                null,
                position,
                [gaia[2][i], gaia[2][i], gaia[2][i]],
                basicMaterials.amb,
                [gaia[1][i][0], gaia[1][i][1], gaia[1][i][2]],
                [0, 0, 0],
                [0, 0, 0],
                gaia[1][i][3]
            ));
        }
    
        let conMap = new Map(connectedObjects);
        connectedObjects = new Map();
        for (let [star1, stars] of conMap.entries()) {
            for (let i = 0; i < stars.length; i = i + 2) {
                if (star1 != sun.index && stars[i] != sun.index) {
                    addConnector(star1, stars[i+1]);
                    addConnector(stars[i], stars[i+1]);
                } else if (connectedObjects.get(star1) === undefined) {
                    connectedObjects.set(star1, [stars[i], stars[i+1]]);
                } else {
                    connectedObjects.get(star1).push(stars[i], stars[i+1]);
                }
            }
        }

        calcSignsConnections();
    }
    
    function draw() {
        
        dt = performance.now() - prevFrameTime;
        prevFrameTime = currFrameTime;
        currFrameTime = performance.now();
        
        if (camUpdate) {
            cam.update(dt);
        }
        if (!getPause()) {
            sun.update(dt, getSpeed());
        }
        
        clickableObjects = [];
        if (showConnections) {
            solidObjects = [].concat(orbits).
                concat(connectors).
                concat(signsConnectors);
        } else {
            solidObjects = [].concat(orbits);
        }
        let position = vec3.create();
        for (let i = 0; i < backgroundObjects.length; i++) {
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
        if (clickable) {
            genIdMap(clickableObjects, cam);
        }
        if (solidObjects.length + shadedObjects.length > 0) {
            render(solidObjects, shadedObjects, cam);
        }
        
        requestAnimationFrame(draw);
    }
    
    function getConnectedObjects() {
        return connectedObjects;
    }
    
    function swapStar(index){
        swapStarAsync(index);
    }
    
    let star1 = null;
    function addConnector(index, color) {
        let s;
        if (index > sun.index) {
            s = backgroundObjects[index-1];
        } else {
            s = backgroundObjects[index];
        }
        if (star1 == null) {
            star1 = s;
            return;
        } else if (s == star1) {
            return;
        } else if ((connectedObjects.get(star1.index) !== undefined && 
        connectedObjects.get(star1.index).indexOf(s.index) != -1) 
        || 
        (connectedObjects.get(s.index) !== undefined && 
        connectedObjects.get(s.index).indexOf(star1.index) != -1)
        ||
        (connectedObjects.get(star1.index) !== undefined &&
        connectedObjects.get(star1.index).indexOf(s.index)%2 == 0)
        ||
        (connectedObjects.get(star1.index) !== undefined &&
        connectedObjects.get(star1.index).indexOf(s.index)%2 == 0)) 
        {
            star1 = null;
            return;
        } else if (connectedObjects.get(star1.index) !== undefined) {
            connectedObjects.get(star1.index).push(s.index, color);
        } else {
            connectedObjects.set(star1.index, [s.index, color]); 
        }
        connectors.push(new Connector(
            star1, 
            s,
            15, 
            color,
            1
        ));
        star1 = null;
    }
    
    function removeConnector(c) {
        if (connectedObjects.get(c.star1.index) !== undefined) {
            if (
                connectedObjects.get(
                    c.star1.index
                ).indexOf(c.star2.index) != -1
            ) {
                connectedObjects.get(c.star1.index).splice(
                    connectedObjects.get(c.star1.index).indexOf(c.star2.index),
                    2
                );
            }
        }
        if (connectedObjects.get(c.star2.index) !== undefined) {
            if (
                connectedObjects.get(
                    c.star2.index
                ).indexOf(c.star1.index) != -1
            ) {
                connectedObjects.get(c.star2.index).splice(
                    connectedObjects.get(c.star2.index).indexOf(c.star1.index),
                    2
                );
            }
        }
        connectors.splice(connectors.indexOf(c),1);
    }
    
    async function sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
        }
    
    async function swapStarAsync(index) {
        let newStar;
        if (index > sun.index) {  
            newStar = backgroundObjects[index-1];
        } else {  
            newStar = backgroundObjects[index];
        }
        let tex = randTexture();
        newStar.updateTexture(tex);
        camUpdate = false;
        clickable = false;
        showConnections = false;
        let relPosition = vec3.create();
        vec3.sub(relPosition, newStar.position, cam.position);
        vec3.normalize(relPosition, relPosition);
        let angle = vec3.angle(relPosition, cam.z)/10;
        let axis = vec3.create();
        let rotMat = mat4.create();
        let loop = true;
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
            [0, 200, -200],
            [0, 0, 1],
            [0, 1, 0],
            0.001 * Math.PI / 180
        );
        if (index == gaia[0].length-1) {
            sunSystem();
            sun.updateTexture(tex);
        } else {
            sun = new Star(
                index, 
                getModel('sphere'), 
                tex,
                [60, 60, 60],
                basicMaterials.amb,
                newStar.ambColor,
                newStar.difColor,
                newStar.speColor,
                1
            );
            let amount = Math.round(Math.random() * 5) + 3;
            let minDist = 130;
            let dist;
            let scale;
            for (let i = 0; i < amount; i++) {
                dist = Math.random() * 50 + minDist * (i + 1);
                scale = Math.random() * 30 + 10;
                sun.addObject(
                    getModel('sphere'),
                    randTexture(),
                    [0, 0, dist],
                    [scale, scale, scale],
                    basicMaterials.all,
                    [Math.random(), Math.random(), Math.random()],
                    [Math.random(), Math.random(), Math.random()],
                    [Math.random(), Math.random(), Math.random()],
                    1,
                    Math.random() * 10 * 
                        Math.pow(-1, Math.round(Math.random())),
                    Math.random() * 10 * 
                        Math.pow(-1, Math.round(Math.random())),
                    Math.random() * 10 * 
                        Math.pow(-1, Math.round(Math.random())),
                    Math.random() * 90 * 
                        Math.pow(-1, Math.round(Math.random())),
                    Math.random() * 90 * 
                        Math.pow(-1, Math.round(Math.random())),
                    Math.random() * 90 * 
                        Math.pow(-1, Math.round(Math.random()))
                ).addDynamicOrbit();
            }
            shadedObjects = sun.getObjectsToRender()[0];
            orbits = sun.getObjectsToRender()[1];
            backgroundObjects = [];
            connectors = [];
            let origin = vec3.clone(gaia[0][index]);
            let position;
            let direction;
            for (let i = 0; i < gaia[0].length; i++) {
                if(i != index) {
                    position = vec3.clone(gaia[0][i]);
                    vec3.sub(position, position, origin);
                    direction = vec3.clone(position);
                    vec3.normalize(direction, direction);
                    vec3.scale(direction, direction, 1000);
                    vec3.scale(position, position, 50);
                    vec3.add(position, position, direction);
                    backgroundObjects.push(new BackgroundStar(
                        i,
                        cam,
                        getModel('circle'),
                        null,
                        position,
                        [gaia[2][i], gaia[2][i], gaia[2][i]],
                        basicMaterials.amb,
                        [gaia[1][i][0], gaia[1][i][1], gaia[1][i][2]],
                        [0, 0, 0],
                        [0, 0, 0],
                        gaia[1][i][3]
                    ));
                }
            }
            let conMap = new Map(connectedObjects);
            connectedObjects = new Map();
            for (let [star1, stars] of conMap.entries()) {
                for (let i = 0; i < stars.length; i += 2) {
                    if (star1 != index && stars[i] != index) {
                        addConnector(star1, stars[i+1]);
                        addConnector(stars[i], stars[i+1]);
                    } else if (connectedObjects.get(star1) === undefined) {
                        connectedObjects.set(star1, [stars[i],stars[i+1]]);
                    } else {
                        connectedObjects.get(star1).push(stars[i], stars[i+1]);
                    }
                }
            }
        }
        calcSignsConnections();
        cam.angle = 0.001 * Math.PI / 180;
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

    function calcSignsConnections() {
        signsConnectors = [];
        signsVisibility.forEach((val, key) => {
            if (val) {
                const list = signs.get(key);
                let index1;
                let index2;
                for (let i = 0; i < list.length; i += 2) {
                    index1 = list[i];
                    index2 = list[i+1];
                    if (index1 != sun.index && index2 != sun.index) {
                        if (index1 > sun.index) {
                            index1--;
                        }
                        if (index2 > sun.index) {
                            index2--;
                        }
                        signsConnectors.push(new Connector(
                            backgroundObjects[index1],
                            backgroundObjects[index2],
                            15,
                            [0.4, 0.1, 0.9],
                            1
                        ));
                        signsConnectors[
                            signsConnectors.length-1
                        ].keyClick = function () {};
                        signsConnectors[
                            signsConnectors.length-1
                        ].select = function () {
                            vec3.scale(this.scale, this.scale, 4);
                            this.scale[1] /= 4;
                         };
                        signsConnectors[
                            signsConnectors.length-1
                        ].unselect = function () {
                            vec3.scale(this.scale, this.scale, 1/4);
                            this.scale[1] *= 4;
                        };
                    }
                }
            }
        });
    }

    function changeSigns(name) {
        signsVisibility.set(name, !signsVisibility.get(name));
        calcSignsConnections();
    }
}
