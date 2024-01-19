var infoText = document.getElementById('infoText');
var pauseButton = document.getElementById('pause');
var pauseImg = document.getElementById('pauseImg');
pauseButton.onclick = onPause.bind(this);
var speedSlider = document.getElementById('speed');
var speedText = document.getElementById('speedText');
speedSlider.oninput = onSlider.bind(this);
var impInput = document.getElementById('impStarSignText');
var impButton = document.getElementById('impStarSign');
var expButton = document.getElementById('expStarSign');
impButton.onclick = onImport.bind(this);
expButton.onclick = onExport.bind(this);

function setInfoText(text) {
    infoText.textContent = text;
}

function getInfoText() {
    return infoText.textContent;
}

function onPause() {
    if (pause) {
        pauseImg.src = "./images/pause.png";
        pause = false;
    } else {
        pauseImg.src = "./images/start.png";
        pause = true;
    }
    
}

function onSlider() {
    speedText.textContent = speedSlider.value;
    speed = speedSlider.value;
}

function getSpeed() {
    return speedSlider.value;
}

function onImport() {
    var regExpression = /[a-zA-Z]/;
    var cObjs = getConnectedObjects();
    var sun = getSun().index;
    var max = getGaia()[0].length-1;
    impInput.select();
    if (regExpression.test(impInput.value)) {
        alert("invalid");
        return;
    }
    var parts = impInput.value.trim().split('/');
    if (parts.length%2 != 1) {
        alert("invalid");
        return;
    }
    for (var i = 1; i < parts.length; i++) {
        if (parseInt(parts[i]) > max) {
            alert("invalid");
            return;
        }
    }
    for (var i = 1; i < parts.length-1; i+=2) {
        if (parseInt(parts[i]) == sun || parseInt(parts[i+1]) == sun) {
            if ((cObjs.get(parseInt(parts[i])) !== undefined && 
            cObjs.get(parseInt(parts[i])).indexOf(parseInt(parts[i+1])) != -1)
            || 
            (cObjs.get(parseInt(parts[i+1])) !== undefined && 
            cObjs.get(parseInt(parts[i+1])).indexOf(parseInt(parts[i]))!= -1))
            {
                continue;
            } 
            else if (cObjs.get(parseInt(parts[i])) === undefined) {
                cObjs.set(parseInt(parts[i]),[parseInt(parts[i+1])]);
            } 
            else {
                cObjs.get(parseInt(parts[i])).push(parseInt(parts[i+1]));
            }
        } else {
            addConnector(parseInt(parts[i]));
            addConnector(parseInt(parts[i+1]));
        }
    }
}

function onExport() {
    var connectedObjects = getConnectedObjects();
    var result = "";
    for (var [star1, stars] of connectedObjects.entries()) {
        for (var i = 0; i < stars.length; i++) {
            result = result + "/" + star1 + "/" + stars[i];
        }
    }
    navigator.clipboard.writeText(result);
    alert("copied star signs to clipboard!");
}
