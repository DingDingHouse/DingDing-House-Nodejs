"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lcg = lcg;
exports.xorshift = xorshift;
exports.cryptoRNG = cryptoRNG;
exports.evaluateRNG = evaluateRNG;
const fs = __importStar(require("fs"));
function lcg(initialSeed) {
    let seed = initialSeed >>> 0;
    const a = 1664525;
    const c = 1013904223;
    return () => {
        seed = (a * seed + c) >>> 0;
        return seed * (1.0 / 4294967296.0);
    };
}
function xorshift(seed) {
    return () => {
        seed ^= seed << 13;
        seed ^= seed >> 17;
        seed ^= seed << 5;
        return (seed >>> 0) / 0xFFFFFFFF;
    };
}
// export function bbs(seed: number): () => number {
//   try {
//
//     const rng = new BBSRandomGenerator(7, 9007199254740991, seed)
//     return () => {
//       const res = rng.generateNumber(0, 1)
//       return res
//     }
//   } catch (er) {
//     console.error("Err in BBSRNG", er)
//   }
// }
const crypto_1 = require("crypto");
// import BBSRandomGenerator from './BlumBlumShum';
function cryptoRNG() {
    return () => {
        const randomValue = parseInt((0, crypto_1.randomBytes)(4).toString('hex'), 16);
        return randomValue / 0x100000000;
    };
}
function evaluateRNG(rng, total, n, iterations) {
    const frequency = new Array(total).fill(0);
    const results = [];
    const csv = [];
    // Collect samples
    for (let i = 0; i < iterations; i++) {
        const numbers = getNNumbers(total, n, rng);
        csv.push(numbers);
        results.push(...numbers);
        for (const number of numbers) {
            frequency[number - 1]++;
        }
    }
    writeMultipleArraysToCSV("data.csv", csv);
    // Basic statistics
    const mean = results.reduce((sum, value) => sum + value, 0) / results.length;
    const variance = results.reduce((sum, value) => sum + Math.pow((value - mean), 2), 0) / results.length;
    // Chi-square test
    const expectedFrequency = (iterations * n) / total;
    const chiSquare = frequency.reduce((sum, observed) => {
        const difference = observed - expectedFrequency;
        return sum + (difference * difference) / expectedFrequency;
    }, 0);
    // Calculate chi-square p-value (using Wilson–Hilferty approximation)
    const degreesOfFreedom = total - 1;
    const z = Math.sqrt(2 * chiSquare) - Math.sqrt(2 * degreesOfFreedom - 1);
    const chiSquarePValue = 1 - normalCDF(z);
    // Uniformity score (0 to 1, where 1 is perfect uniformity)
    const maxDeviation = Math.max(...frequency) - Math.min(...frequency);
    const worstPossibleDeviation = iterations * n;
    const uniformityScore = 1 - (maxDeviation / worstPossibleDeviation);
    return {
        frequency,
        mean,
        variance,
        chiSquare,
        chiSquarePValue,
        uniformityScore
    };
}
function getNNumbers(total, n, rng) {
    if (n > total) {
        throw new Error('n cannot be greater than total');
    }
    const result = [];
    const usedNumbers = new Set();
    while (result.length < n) {
        const number = Math.floor(rng() * total) + 1;
        if (!usedNumbers.has(number)) {
            usedNumbers.add(number);
            result.push(number);
        }
    }
    return result;
}
// Helper function for calculating normal CDF (using error function approximation)
function normalCDF(x) {
    return 0.5 * (1 + erf(x / Math.sqrt(2)));
}
// Error function approximation
function erf(x) {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}
function writeMultipleArraysToCSV(filename, data) {
    try {
        const csvContent = data.map(row => row.join(',')).join('\n');
        fs.writeFileSync(filename, csvContent);
        console.log(`Successfully wrote data to ${filename}`);
    }
    catch (error) {
        console.error('Error writing CSV file:', error);
        throw error;
    }
}
