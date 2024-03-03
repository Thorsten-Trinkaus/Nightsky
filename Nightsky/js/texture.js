{
    const textures = new Map();
    const texArray = [];

    function getTexture(name) {
        return textures.get(name);
    }

    function randTexture() {
        return texArray[Math.floor(Math.random()*texArray.length)];
    }

    function addTexture(name, texture) {
        if (models.get(name) === undefined) {
            models.set(name, model);
        } else {
            console.log("Texture " + name + " already exists!");
        }
    }

    function addTextureFromPath(name, path) {
        let tex = getDataMap(path);
        if (tex === undefined) {
            console.log(path + " does not exist!")
        } else {
            if (textures.get(name) === undefined) {
                textures.set(name, tex);
                texArray.push(tex);
            } else {
                console.log("Texture " + name + " already exists!");
            }
        }
    }
}