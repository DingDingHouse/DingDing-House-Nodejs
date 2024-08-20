"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomResultGenerator = void 0;
class RandomResultGenerator {
    constructor(current) {
        let matrix = [];
        for (let x = 0; x < current.settings.matrix.x; x++) {
            const startPosition = this.getRandomIndex((current.settings.reels[x].length - 1));
            // console.log("StartIndex : ", startPosition);
            for (let y = 0; y < current.settings.matrix.y; y++) {
                if (!matrix[y])
                    matrix[y] = [];
                matrix[y][x] = current.settings.reels[x][(startPosition + y) % current.settings.reels[x].length];
                // console.log("X Index ", x, " Yindex ", y, " ", current.settings.reels[x][(startPosition + y) % current.settings.reels[x].length]);
            }
        }
        // console.log("Matrix  :   ", matrix);
        current.settings.resultReelIndex = matrix;
        // console.log("gameSettings._winData.resultReelIndex", current.settings.resultReelIndex);
        // matrix.pop();
        // matrix.pop();
        // matrix.pop();
        // matrix.push(['1', '9', '9', '2', '4'])
        // matrix.push(['1', '5', '9', '6', '7'])
        // matrix.push(['1', '8', '1', '5', '1'])
        current.settings.resultSymbolMatrix = matrix;
        // console.log("MATRIX " + matrix);
    }
    getRandomIndex(maxValue) {
        return Math.floor(Math.random() * (maxValue + 1));
    }
}
exports.RandomResultGenerator = RandomResultGenerator;