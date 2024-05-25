{
    // Map of textures (key: name, value: texture). This map is not global, 
    // but can be accessed from the outside by the function getTexture(). 
    // To add a model to the map either use addTexture() or 
    // addTextureFromPath(). This map is used to get textures selectively.
    const textures = new Map();
    // List of all textures. This list is not global, but can be accessed from
    // the outside by the function randTexture(). The textures get added
    // automatically by adding textures to the textures map. This list is used
    // to get textures randomly.
    const texArray = [];

    /**
     * Getter function for the textures map.
     * @param {!string} name - the name of the texture that should be returned
     * @returns {?HTMLImageElement} the function returns the texture with the 
     *      specified name | if there is no texture with this name, the 
     *      function returns null
     */
    function getTexture(name) {
        // Return null, if there is no texture with this name.
        if (textures.get(name) === undefined) {
            console.error("There is no texture with the name " + name);
            return null;
        }
        // Else, return the needed texture.
        return textures.get(name);
    }
    /**
     * This function can be used to get a random texture form the list of 
     * all textures. If there is no texture in the list, this function
     * returns null.
     * @returns {?HTMLImageElement} returns the random texture
     */
    function randTexture() {
        // Return null, if there is no texture in the list.
        if (texArray.length == 0) {
            return null;
        }
        // Else, return a random texture.
        return texArray[Math.floor(Math.random() * texArray.length)];
    }

    /**
     * Setter function of the textures map. 
     * This also adds the texture to the list of textures.
     * @param {!string} name - name for the new texture
     * @param {!HTMLImageElement} texture - the texture to be added
     */
    function addTexture(name, texture) {
        // If there is no texture with the given name, add the new texture.
        // Else, the texture already exists. This case gets logged to 
        // the console.
        if (textures.get(name) === undefined) {
            textures.set(name, texture);
            texArray.push(texture);
        } else {
            console.error("Texture " + name + " already exists!");
        }
    }

    /**
     * Setter function of the textures map. This function uses a path to get 
     * the new texture, which then gets added to the textures map. The texture
     * is also added to the list of textures. Note that the texture for the 
     * path needs to be loaded before calling this function. See load.js for 
     * more information on how to load data from files.
     * @param {!string} name - name for the new texture
     * @param {!string} path - path of the needed texture
     */
    function addTextureFromPath(name, path) {
        // Get the texture from the path. 
        // The function getDataMap() is defined in load.js.
        let tex = getDataMap(path);
        // If there is no texture for the given path, the function logs this to 
        // the console. Else, add the texture to the textures map and list.
        if (tex === undefined) {
            console.error(path + " does not exist!")
        } else {
            // If there is no texture with the specified name yet, add the 
            // texture. Else, the texture already exists. This case gets logged
            // to the console.
            if (textures.get(name) === undefined) {
                textures.set(name, tex);
                texArray.push(tex);
            } else {
                console.error("Texture " + name + " already exists!");
            }
        }
    }
}