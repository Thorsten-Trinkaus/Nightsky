{
    //text dispaying iformation about the selected object
    const infoText = document.getElementById('infoText');
    
    // button to pause and unpause the objects orbiting the sun
    const pauseButton = document.getElementById('pause');
    pauseButton.onclick = onPause.bind(this);
    // imiage dispaying the pause button
    const pauseImg = document.getElementById('pauseImg');
    // current pause state - true if paused
    let pause = false;
    
    // slider controlling orbit speed
    const speedSlider = document.getElementById('speed');
    speedSlider.oninput = onSlider.bind(this);
    // text displaying current orbit speed
    const speedText = document.getElementById('speedText');
    // current speed
    let speed = speedSlider.value;
    speedText.textContent = speed;
    
    // text input for importing a list of connections between stars
    const impInput = document.getElementById('impStarSignText');
    // button to start the import
    const impButton = document.getElementById('impStarSign');
    impButton.onclick = onImport.bind(this);
    
    // button to copy the current connection to the clipboard
    const expButton = document.getElementById('expStarSign');
    expButton.onclick = onExport.bind(this);
    
    // color picker for coloring new connections
    const colorPicker = document.getElementById('color');
    const colorPickerWrapper = document.getElementById('color-wrapper');
    colorPicker.onchange = onColorChange.bind(this);
    onColorChange();
    /**
    * returns the color of the color picker in rgb
    * @returns {[number, number, number]} color currently selected
    */
    function getColor() {
        const color = colorPicker.value;
        const r = parseInt(color.substr(1,2), 16);
        const g = parseInt(color.substr(3,2), 16);
        const b = parseInt(color.substr(5,2), 16);
        return [r/255,g/255,b/255];
    }
    
    function onColorChange() {
        colorPickerWrapper.style.backgroundColor = colorPicker.value;
    }

    /**
    * changes the info text
    * @param {string} text - string to be set as the info text 
    */
    function setInfoText(text) {
        infoText.textContent = text;
    }
    
    /**
    * getter function for the infotext
    * @returns {string} current infotext
    */
    function getInfoText() {
        return infoText.textContent;
    }
    
    /**
    * Gets called by the onclick event of the pause button.
    * The function changes the pause image and pauses / unpauses
    */
    function onPause() {
        // change the image
        if (pause) {
            pauseImg.src = "./images/pause.png";
        } else {
            pauseImg.src = "./images/start.png";
        }
        // pause / unpause
        pause = !pause;
    }
    
    /**
    * getter function for the pause state
    * @returns {boolean} current pause state
    */
    function getPause() {
        return pause;
    }
    
    /**
    * Gets called by the oninput event of the speed slider.
    * The function changes the speed and the speedtext according to the slider
    */
    function onSlider() {
        speedText.textContent = speedSlider.value;
        speed = speedSlider.value;
    }
    
    /**
    * getter function for the orbit speed
    * @returns {number} current speed
    */
    function getSpeed() {
        return speed;
    }
    
    /**
    * Gets called by the onclick event of the import button
    */
    function onImport() {
        
        let cObjs = getConnectedObjects();
        let sun = getSun().index;
        let max = getGaia()[0].length-1;
        impInput.select();
        let parts = impInput.value.trim().split('/');
        if ((parts.length-1)%3 != 0) {
            alert("invalid input");
            return;
        }
        const regExpression = /[a-zA-Z]/;
        for (let i = 1; i < parts.length; i++) {
            if (i%3 != 0 && regExpression.test(parts[i])) {
                alert("invalid input");
                return; 
            }
            else if (i%3 != 0 && parseInt(parts[i]) > max) {
                alert("invalid input");
                return;
            }
        }
        for (let i = 1; i < parts.length-1; i+=3) {
            if (parseInt(parts[i]) == sun || parseInt(parts[i+1]) == sun) {
                if ((cObjs.get(parseInt(parts[i])) !== undefined && 
                cObjs.get(
                    parseInt(parts[i])
                ).indexOf(parseInt(parts[i+1])) != -1)
                || 
                (cObjs.get(parseInt(parts[i+1])) !== undefined && 
                cObjs.get(
                    parseInt(parts[i+1])
                ).indexOf(parseInt(parts[i]))!= -1)
                ||
                (cObjs.get(parseInt(parts[i])) !== undefined && 
                cObjs.get(
                    parseInt(parts[i])
                ).indexOf(parseInt(parts[i+1]))%2 == 0)
                ||
                (cObjs.get(parseInt(parts[i+1])) !== undefined && 
                cObjs.get(
                    parseInt(parts[i+1])
                ).indexOf(parseInt(parts[i]))%2 == 0))
                {
                    continue;
                } 
                else if (cObjs.get(parseInt(parts[i])) === undefined) {
                    const r = parseInt(parts[i+2].substr(0, 2), 16);
                    const g = parseInt(parts[i+2].substr(2, 2), 16);
                    const b = parseInt(parts[i+2].substr(4, 2), 16);
                    const color = [r/255, g/255, b/255];
                    cObjs.set(
                        parseInt(parts[i]),
                        [
                            parseInt(parts[i+1]), 
                            color
                        ]
                    );
                } 
                else {
                    const r = parseInt(parts[i+2].substr(0, 2), 16);
                    const g = parseInt(parts[i+2].substr(2, 2), 16);
                    const b = parseInt(parts[i+2].substr(4, 2), 16);
                    const color = [r/255, g/255, b/255];
                    cObjs.get(parseInt(parts[i])).push(
                        parseInt(parts[i+1]),
                        color
                    );
                }
            } else {
                const r = parseInt(parts[i+2].substr(0, 2), 16);
                const g = parseInt(parts[i+2].substr(2, 2), 16);
                const b = parseInt(parts[i+2].substr(4, 2), 16);
                const color = [r/255, g/255, b/255];
                addConnector(parseInt(parts[i]), color);
                addConnector(parseInt(parts[i+1]), color);
            }
        }
    }
    
    /**
    * Gets called by the onclick event of the export button.
    * Copies the current connection to the clipboard.
    */
    function onExport() {
        let connectedObjects = getConnectedObjects();
        let result = "";
        for (let [star1, stars] of connectedObjects.entries()) {
            for (let i = 0; i < stars.length; i = i + 2) {
                let r = (stars[i+1][0] * 255).toString(16);
                let g = (stars[i+1][1] * 255).toString(16);
                let b = (stars[i+1][2] * 255).toString(16);
                r = r.length == 1? "0" + r : r;
                g = g.length == 1? "0" + g : g;
                b = b.length == 1? "0" + b : b;
                result = result + "/" + star1 + "/" + stars[i] + "/" + 
                    r + g + b;
            }
        }
        navigator.clipboard.writeText(result);
        alert("copied star signs to clipboard!");
    }

    function starSignList(starSigns) {
        const signList = document.getElementById("signList");
        for (let i = 0; i < starSigns.length; i++) {
            const listElement = document.createElement("li");
            const checkBox = document.createElement("input");
            checkBox.type = "checkbox";
            checkBox.name = starSigns[i];
            checkBox.onclick = function () {
                changeSigns(checkBox.name);
            }
            const signText = document.createTextNode(starSigns[i]);
            listElement.appendChild(checkBox);
            listElement.appendChild(signText);
            signList.appendChild(listElement);
        }
        signList.style.opacity = "1";
    }
}