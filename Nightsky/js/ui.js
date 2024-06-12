{
    // The 3 divs that make up the ui.
    const controlsDiv = document.getElementById("controls");
    const infoDiv = document.getElementById("info");
    const starSignDiv = document.getElementById("starSign");
    // Should the ui be visible?
    // Yes:    true
    // NO :    false
    // The ui will be invisible on startup and will be set to visible as soon 
    // as the scene is loaded. 
    // To change the visibility use the function changeUiVisibility().
    let uiVisibility = false;
    
    // Text displaying information about the currently selected object.
    const infoText = document.getElementById("infoText");
    
    // Button to pause / unpause the orbit of the objects in the scene.
    // Pressing the button will call onPause().
    const pauseButton = document.getElementById("pause");
    pauseButton.onclick = onPause.bind(this);
    // Image of the pause button.
    const pauseImg = document.getElementById("pauseImg");
    // Current pause state - true if paused.
    let pause = false;
    
    // Slider controlling orbit speed. Changing the value of the slider
    // will call onSlider().
    const speedSlider = document.getElementById("speed");
    speedSlider.oninput = onSlider.bind(this);
    // Text displaying current orbit speed.
    const speedText = document.getElementById("speedText");
    // Get the current orbit speed and set the speed text.
    let speed = speedSlider.value;
    speedText.textContent = speed;
    
    // text input for importing a list of connections between stars
    const impInput = document.getElementById("impStarSignText");
    // button to start the import
    const impButton = document.getElementById("impStarSign");
    impButton.onclick = onImport.bind(this);
    
    // button to copy the current connection to the clipboard
    const expButton = document.getElementById("expStarSign");
    expButton.onclick = onExport.bind(this);
    
    // color picker for coloring new connections
    const colorPicker = document.getElementById("color");
    const colorPickerWrapper = document.getElementById("colorWrapper");
    colorPicker.onchange = onColorChange.bind(this);
    onColorChange();

    /**
     * This function toggles the visibility of the ui.
     */
    function changeUiVisibility() {
        // If the ui is visible, make it invisible. Else, make it visible.
        if (uiVisibility) {
            // Put the divs that make up the ui below the canvases.
            controlsDiv.style.zIndex = "-1";
            infoDiv.style.zIndex = "-1";
            starSignDiv.style.zIndex = "-1";
        } else {
            // Put the divs that make up the ui above the canvases.
            controlsDiv.style.zIndex = "3";
            infoDiv.style.zIndex = "3";
            starSignDiv.style.zIndex = "3";
        }
        // Change the visibility value.
        uiVisibility = !uiVisibility;
    }

    /**
    * This function returns the color currently selected by the color picker.
    * @returns {[number, number, number]} color currently selected
    */
    function getColor() {
        // Get the color value of the colorPicker.
        const color = colorPicker.value;
        // The value of the color picker is a hex value. 
        // Compute the rgb values from the hax value.
        const r = parseInt(color.substr(1,2), 16);
        const g = parseInt(color.substr(3,2), 16);
        const b = parseInt(color.substr(5,2), 16);
        // Return the rgb[0, 1] values.
        return [r / 255, g / 255, b / 255];
    }
    
    /**
     * This function will be called by the onchange event of the color 
     * picker. It changes the backgroundColor of the wrapper, so it fits to
     * the selected color.
     */
    function onColorChange() {
        colorPickerWrapper.style.backgroundColor = colorPicker.value;
    }

    /**
    * This function allows to change the info text to a new string.
    * @param {string} text - string to be set as the info text 
    */
    function setInfoText(text) {
        infoText.textContent = text;
    }
    
    /**
    * Getter function for the info text. Returns the value as a string.
    * @returns {string} current infotext as a string.
    */
    function getInfoText() {
        return infoText.textContent;
    }
    
    /**
    * Gets called by the onclick event of the pause button.
    * The function changes the pause state and changes the pause button image.
    */
    function onPause() {
        // Change the image.
        if (pause) {
            pauseImg.src = "./images/pause.png";
        } else {
            pauseImg.src = "./images/start.png";
        }
        // Change the pause state.
        pause = !pause;
    }
    
    /**
    * Getter function for the pause state.
    * @returns {boolean} current pause state
    */
    function getPause() {
        return pause;
    }
    
    /**
    * Gets called by the oninput event of the speed slider.
    * The function changes the speed and the speed text according 
    * to the slider value.
    */
    function onSlider() {
        speedText.textContent = speedSlider.value;
        speed = speedSlider.value;
    }
    
    /**
    * Getter function for the orbit speed.
    * @returns {number} current speed
    */
    function getSpeed() {
        return speed;
    }
    
    /**
    * Gets called by the onclick event of the import button.
    * This function reads the text input parses the string and
    * adds Connector objects (celestial.js) accordingly.
    * For this function to work, the string must be of form:
    * /firstObj1/fistObj2/fistColor/secondObj1/secondObj2/secondColor/...
    * where the objects are represented by the index in the gaia list 
    * (scene.js) and the color values of the connectors are hex values.
    */
    function onImport() {
        // Get the map of the current connected objects.
        // The function getConnectedObjects() is defined in scene.js.
        const cObjs = getConnectedObjects();
        // Index of the current sun.
        const sun = getSun().index;
        // Max index.
        const max = getGaia()[0].length-1;

        // Get and split the string from the text input.
        impInput.select();
        const parts = impInput.value.trim().split("/");

        // Check if the amount of arguments fits the requirements.
        // If not, alert the user and abort.
        if (parts.length == 1 || (parts.length-1)%3 != 0) {
            alert("invalid input");
            return;
        }
        
        const regExpression = /^[0-9]+$/
        // For each argument.
        for (let i = 1; i < parts.length; i++) {
            // Check if the indices are numbers. If not, alert the
            // user and abort. Also check if the indices are in the
            // range of possible indices. If not, alert the user and
            // abort.
            if (!(i%3 == 0 || regExpression.test(parts[i]))) {
                alert("invalid input");
                return; 
            }
            else if (i%3 != 0 && parseInt(parts[i]) > max) {
                alert("invalid input");
                return;
            }
        }

        // All the arguments are correct. For each triplet of arguments.
        for (let i = 1; i < parts.length-1; i += 3) {
            // If the both indices are the same, skip this triplet, because
            // a object can not be connected to itself.
            if (parseInt(parts[i]) == parseInt(parts[i+1])) {
                continue;
            }
            // If one of the indices matches the index of the current sun, 
            // and the connection is already present in the map we skip
            // this triplet. If one index matches but it is not present, add
            // the connection to the map, but do not add a connector. If the
            // indices do not match, add the connection to the map and add the
            // connector.
            if (parseInt(parts[i]) == sun || parseInt(parts[i+1]) == sun) {
                // Is it in the map already?
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
                else {
                    // Compute rgb[0, 1] color values from the hex value.
                    const r = parseInt(parts[i+2].substr(0, 2), 16);
                    const g = parseInt(parts[i+2].substr(2, 2), 16);
                    const b = parseInt(parts[i+2].substr(4, 2), 16);
                    const color = [r/255, g/255, b/255];

                    // If there is no entry in the map already, create one.
                    if (cObjs.get(parseInt(parts[i])) === undefined) {
                        cObjs.set(
                            parseInt(parts[i]),
                            [
                                parseInt(parts[i+1]), 
                                color
                            ]
                        );
                    } else {
                        cObjs.get(parseInt(parts[i])).push(
                            parseInt(parts[i+1]),
                            color
                        );
                    }
                    
                }
            } else {
                // Compute rgb[0, 1] color values from the hex value.
                const r = parseInt(parts[i+2].substr(0, 2), 16);
                const g = parseInt(parts[i+2].substr(2, 2), 16);
                const b = parseInt(parts[i+2].substr(4, 2), 16);
                const color = [r/255, g/255, b/255];

                // Add the connection and the connector through addConnector().
                // The function is defined in scene.js.
                addConnector(parseInt(parts[i]), color);
                addConnector(parseInt(parts[i+1]), color);
            }
        }
    }
    
    /**
    * Gets called by the onclick event of the export button.
    * Copies the current connections to the clipboard as a string of form:
    * /firstObj1/fistObj2/fistColor/secondObj1/secondObj2/secondColor/...
    * where the objects are represented by the index in the gaia list 
    * (scene.js) and the color values of the connectors are hex values.
    */
    function onExport() {
        // Get the map of connections, that need to be exported.
        // The function getConnectedObjects() is defined in scene.js.
        const connectedObjects = getConnectedObjects();
        // The export-string we want to save to the clipboard.
        let result = "";
        // For each entry in the map look at all the connections.
        for (let [star1, stars] of connectedObjects.entries()) {
            // For each of these connections.
            for (let i = 0; i < stars.length; i = i + 2) {
                // Convert the color of the connection from rgb[0, 1] to 
                // a hex-string.
                let r = (stars[i+1][0] * 255).toString(16);
                let g = (stars[i+1][1] * 255).toString(16);
                let b = (stars[i+1][2] * 255).toString(16);
                r = r.length == 1? "0" + r : r;
                g = g.length == 1? "0" + g : g;
                b = b.length == 1? "0" + b : b;
                let hex = r + g + b;
                // Add the indices of the connected objects and the color of 
                // the connection between them to the result.
                result = result + "/" + star1 + "/" + stars[i] + "/" + hex;
            }
        }
        // Copy the result to the clipboard and alert the user.
        navigator.clipboard.writeText(result);
        alert("copied star signs to clipboard!");
    }

    /**
     * This function fills the signList with checkboxes for all the
     * star signs given as a list of names.
     * @param {!string[]} starSigns - list of names
     */
    function starSignList(starSigns) {
        // Get the signList.
        const signList = document.getElementById("signList");
        // Empty the current list.
        signList.innerHTML = "";
        
        // For every name in the given list.
        for (let i = 0; i < starSigns.length; i++) {
            // Create a list element for the list.
            const listElement = document.createElement("li");
            // Create a checkbox for the list element.
            const checkBox = document.createElement("input");
            // Change the parameter of the checkbox.
            checkBox.type = "checkbox";
            checkBox.name = starSigns[i];
            checkBox.onclick = function () {
                changeSigns(checkBox.name); // This is defined in scene.js.
            }
            // Create a text element for the lost element.
            const signText = document.createElement("text");
            // Create the text content for the text element.
            const signTextCont = document.createTextNode(starSigns[i]);
            signText.classList.add("contentList");

            // Append everything to each other.
            signText.appendChild(signTextCont);
            listElement.appendChild(checkBox);
            listElement.appendChild(signText);
            signList.appendChild(listElement);
        }
        
        // Make the list visible.
        signList.style.opacity = "1";
    }
}