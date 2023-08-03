class Stars {
    constructor(n, size) {
        this.vertices = [];
        this.indices = [];
        this.verticesLength = 0;
        this.indicesLength - 0;
        for (var i = 0; i < n; i++) { 
            var position = [Math.random() * size * Math.pow(-1, Math.round(Math.random())), Math.random() * size * Math.pow(-1, Math.round(Math.random())), Math.random() * size * Math.pow(-1, Math.round(Math.random()))];
            var topColor = [Math.random(),Math.random(),Math.random()];
            var leftColor = [Math.random(),Math.random(),Math.random()];
            var rightColor = [Math.random(),Math.random(),Math.random()];
            var frontColor = [Math.random(),Math.random(),Math.random()];
            var backColor = [Math.random(),Math.random(),Math.random()];
            var bottomColor = [Math.random(),Math.random(),Math.random()];
            this.vertices.push(
                // X, Y, Z         R, G, B  
                // Top
                -1.0 + position[0], 1.0 + position[1], -1.0 + position[2],   topColor[0], topColor[1], topColor[2],
                -1.0 + position[0], 1.0 + position[1], 1.0 + position[2],    topColor[0], topColor[1], topColor[2],
                1.0 + position[0], 1.0 + position[1], 1.0 + position[2],     topColor[0], topColor[1], topColor[2],
                1.0 + position[0], 1.0 + position[1], -1.0 + position[2],    topColor[0], topColor[1], topColor[2],
                // Left
                -1.0 + position[0], 1.0 + position[1], 1.0 + position[2],    leftColor[0],leftColor[1],leftColor[2],
                -1.0 + position[0], -1.0 + position[1], 1.0 + position[2],   leftColor[0],leftColor[1],leftColor[2],
                -1.0 + position[0], -1.0 + position[1], -1.0 + position[2],  leftColor[0],leftColor[1],leftColor[2],
                -1.0 + position[0], 1.0 + position[1], -1.0 + position[2],   leftColor[0],leftColor[1],leftColor[2],
                // Right
                1.0 + position[0], 1.0 + position[1], 1.0 + position[2],     rightColor[0],rightColor[1],rightColor[2],
                1.0 + position[0], -1.0 + position[1], 1.0 + position[2],    rightColor[0],rightColor[1],rightColor[2],
                1.0 + position[0], -1.0 + position[1], -1.0 + position[2],   rightColor[0],rightColor[1],rightColor[2],
                1.0 + position[0], 1.0 + position[1], -1.0 + position[2],    rightColor[0],rightColor[1],rightColor[2],
                // Front
                1.0 + position[0], 1.0 + position[1] , 1.0 + position[2],     frontColor[0],frontColor[1],frontColor[2],
                1.0 + position[0], -1.0 + position[1], 1.0 + position[2],    frontColor[0],frontColor[1],frontColor[2],
               -1.0 + position[0], -1.0 + position[1], 1.0 + position[2],   frontColor[0],frontColor[1],frontColor[2],
               -1.0 + position[0], 1.0 + position[1], 1.0 + position[2],    frontColor[0],frontColor[1],frontColor[2],
                // Back
                1.0 + position[0], 1.0 + position[1], -1.0 + position[2],    backColor[0],backColor[1],backColor[2],
                1.0 + position[0], -1.0 + position[1], -1.0 + position[2],   backColor[0],backColor[1],backColor[2],
                -1.0 + position[0], -1.0 + position[1], -1.0 + position[2],  backColor[0],backColor[1],backColor[2],
                -1.0 + position[0], 1.0 + position[1], -1.0 + position[2],   backColor[0],backColor[1],backColor[2],
                // Bottom
                -1.0 + position[0], -1.0 + position[1], -1.0 + position[2],  bottomColor[0],bottomColor[1],bottomColor[2],
                -1.0 + position[0], -1.0 + position[1], 1.0 + position[2],   bottomColor[0],bottomColor[1],bottomColor[2],
                1.0 + position[0], -1.0 + position[1], 1.0 + position[2],    bottomColor[0],bottomColor[1],bottomColor[2],
                1.0 + position[0], -1.0 + position[1], -1.0 + position[2],   bottomColor[0],bottomColor[1],bottomColor[2],
            );
            this.indices.push(
                // Top
                0 + this.verticesLength, 1 + this.verticesLength, 2 + this.verticesLength,
                0 + this.verticesLength, 2 + this.verticesLength, 3 + this.verticesLength,
                // Left
                5 + this.verticesLength, 4 + this.verticesLength, 6 + this.verticesLength,
                6 + this.verticesLength, 4 + this.verticesLength, 7 + this.verticesLength,
                // Right
                8 + this.verticesLength, 9 + this.verticesLength, 10 + this.verticesLength,
                8 + this.verticesLength, 10 + this.verticesLength, 11 + this.verticesLength,
                // Front
                13 + this.verticesLength, 12 + this.verticesLength, 14 + this.verticesLength,
                15 + this.verticesLength, 14 + this.verticesLength, 12 + this.verticesLength,
                // Back
                16 + this.verticesLength, 17 + this.verticesLength, 18 + this.verticesLength,
                16 + this.verticesLength, 18 + this.verticesLength, 19 + this.verticesLength,
                // Bottom
                21 + this.verticesLength, 20 + this.verticesLength, 22 + this.verticesLength,
                22 + this.verticesLength, 20 + this.verticesLength, 23 + this.verticesLength
            );
            this.verticesLength = this.vertices.length;
            this.indicesLength = this.indices.length;
        }
    }
}