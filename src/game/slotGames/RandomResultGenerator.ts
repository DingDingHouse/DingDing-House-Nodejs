import {  generateRandomNumber, generatetrueRandomNumber } from "../Utils/gameUtils";
import crypto from 'crypto';
export class RandomResultGenerator {
  constructor(current) {
    let matrix: string[][] = [];
    for (let x = 0; x < current.settings.currentGamedata.matrix.x; x++) {
      const startPosition = this.getRandomIndex((current.settings.reels[x].length - 1));
      for (let y = 0; y < current.settings.currentGamedata.matrix.y; y++) {
        if (!matrix[y]) matrix[y] = [];
        matrix[y][x] = current.settings.reels[x][(startPosition + y) % current.settings.reels[x].length];
      }
    }


    // matrix.pop();
    // matrix.pop();
    // matrix.pop();
    // matrix.push(['10', '6', '10', '0', '4','6'])
    // matrix.push(['1', '11', '14', '10', '1','6'])
    // matrix.push(['5', '8', '1', '5', '1','6'])
    matrix.forEach(row => console.log(row.join(' ')));
    current.settings.resultReelIndex = matrix;
    current.settings.resultSymbolMatrix = matrix;

  }
  getRandomIndex(maxValue: number): number {
    const rngFunctions = [
            (max: number) => generateRandomNumber(Date.now(), max), // RNG1
            (max: number) => chaoticRandom(generateUniqueSeed()) * max, // RNG2
            (max: number) => generatelcgRandomNumbers(generateUniqueSeed(), max), // RNG3
            (max: number) => generatetrueRandomNumber(max) // RNG4      
        ];
        const rngIndex = Math.floor(Math.random() * rngFunctions.length);
        const rngFunction = rngFunctions[rngIndex];
 
        return Math.floor(rngFunction (maxValue + 1));



    
    function newtonRng(seed, maxIterations = 10) {
        let x = seed;
        const constant = 71;
    
        const epsilon = 1e-10;
    
        for (let i = 0; i < maxIterations; i++) {
            let fx = Math.sin(x * x) - constant;
            let fpx = 2 * x * Math.cos(x);
    
            let nextX = x - fx / (fpx + epsilon);
    
            if (Math.abs(nextX - x) < epsilon) {
                break;
            }
    
            x = nextX + Math.random();
        }
    
        return Math.abs(x % 1);
    }
    
    function generateBetRng(seed, number, maxIterations = 20) {
        const randomValue = newtonRng(seed, maxIterations);
        return Math.floor(randomValue * number);
    }
    
    function generateRandomNumber(seed, number) {
        let randomNum = generateBetRng(seed, number);
        seed = (seed * Math.random() * Math.sin(seed) + Date.now()) % (1e10 * Math.random()) + Math.random();
        return randomNum;
    }
    
    // RNG2
    
    function chaoticRandom(seed) {
        const noise = Math.sin(seed) * 10000;
        const randomValue = (Math.random() + noise) % 1;
    
        return Math.abs(randomValue);
    }
    
    // RNG3 - LCG
    
    function lcg(seed) {
        const a = 1664525;
        const c = 1013904223;
        const m = Math.pow(2, 32);
    
        seed = (a * seed + c) % m;
    
        return seed / m;
    }
    
    function generatelcgRandomNumbers(seed, count) {
        seed = Math.abs(seed + Math.random() * 1000);
        const randomValue = lcg(seed >>> 0);
        const randomNumber = Math.round(randomValue * count);
        return randomNumber;
    }
    
    // RNG4 - TRUE RANDOM
    
    function trueRandom(min, max) {
        const randomBytes = crypto.randomBytes(4);
        const randomValue = randomBytes.readUInt32BE(0);
        return min + (randomValue % (max - min));
    }
    
    function generatetrueRandomNumber(max) {
        const randomNumber = trueRandom(0, max);
        return randomNumber;
    }
    function generateUniqueSeed(): number {
        return Math.floor(Date.now() * Math.random() + performance.now());
    }

  }
  

}

