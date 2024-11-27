"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeGameSettings = initializeGameSettings;
exports.generateInitialReel = generateInitialReel;
exports.makePayLines = makePayLines;
exports.checkForWin = checkForWin;
exports.wildExpansion = wildExpansion;
exports.sendInitData = sendInitData;
exports.makeResultJson = makeResultJson;
const WinData_1 = require("../BaseSlotGame/WinData");
const gameUtils_1 = require("../../Utils/gameUtils");
const types_1 = require("./types");
/**
 * Initializes the game settings using the provided game data and game instance.
 * @param gameData - The data used to configure the game settings.
 * @param gameInstance - The instance of the SLCM class that manages the game logic.
 * @returns An object containing initialized game settings.
 */
function initializeGameSettings(gameData, gameInstance) {
    return {
        id: gameData.gameSettings.id,
        matrix: gameData.gameSettings.matrix,
        currentGamedata: gameData.gameSettings,
        resultSymbolMatrix: [],
        bets: gameData.gameSettings.bets,
        Symbols: gameInstance.initSymbols,
        lineData: [],
        _winData: new WinData_1.WinData(gameInstance),
        currentBet: 0,
        currentLines: 0,
        BetPerLines: 0,
        reels: [],
        isWildExpandedReels: [],
        isWildExpanded: false,
        isWildExpandedCount: 0,
        wild: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        }
    };
}
/**
 * Generates the initial reel setup based on the game settings.
 * @param gameSettings - The settings used to generate the reel setup.
 * @returns A 2D array representing the reels, where each sub-array corresponds to a reel.
 */
function generateInitialReel(gameSettings) {
    const reels = [[], [], [], [], []];
    gameSettings.Symbols.forEach((symbol) => {
        for (let i = 0; i < 5; i++) {
            const count = symbol.reelInstance[i] || 0;
            for (let j = 0; j < count; j++) {
                reels[i].push(symbol.Id);
            }
        }
    });
    reels.forEach((reel) => {
        shuffleArray(reel);
    });
    return reels;
}
/**
 * Shuffles the elements of an array in place using the Fisher-Yates algorithm.
 * @param array - The array to be shuffled.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
function makePayLines(gameInstance) {
    const { settings } = gameInstance;
    settings.currentGamedata.Symbols.forEach((element) => {
        if (!element.useWildSub) {
            handleSpecialSymbols(element, gameInstance);
        }
    });
}
function handleSpecialSymbols(symbol, gameInstance) {
    switch (symbol.Name) {
        case types_1.specialIcons.wild:
            gameInstance.settings.wild.SymbolName = symbol.Name;
            gameInstance.settings.wild.SymbolID = symbol.Id;
            gameInstance.settings.wild.useWild = true;
            break;
        default:
            break;
    }
}
//CHECK WINS ON PAYLINES WITH OR WITHOUT WILD
function checkForWin(gameInstance) {
    try {
        const { settings } = gameInstance;
        if (settings.isWildExpandedReels.length === 2 && settings.isWildExpanded) {
            console.log("Wild expansion limit reached. No further win checks will occur.");
            return;
        }
        const winningLines = [];
        let totalPayout = 0;
        if (settings.isWildExpandedReels.length < 2) {
            wildExpansion(gameInstance);
            console.log("CHECKING ON REEL", JSON.stringify(settings.resultSymbolMatrix));
        }
        settings.lineData.forEach((line, index) => {
            const firstSymbolPositionLTR = line[0];
            const firstSymbolPositionRTL = line[line.length - 1];
            // Get first symbols for both directions
            let firstSymbolLTR = settings.resultSymbolMatrix[firstSymbolPositionLTR][0];
            let firstSymbolRTL = settings.resultSymbolMatrix[firstSymbolPositionRTL][line.length - 1];
            // Handle wild symbols for both directions
            if (firstSymbolLTR === settings.wild.SymbolID) {
                firstSymbolLTR = findFirstNonWildSymbol(line, gameInstance);
            }
            if (firstSymbolRTL === settings.wild.SymbolID) {
                firstSymbolRTL = findFirstNonWildSymbol(line, gameInstance, 'RTL');
            }
            // Left-to-right check
            const LTRResult = checkLineSymbols(firstSymbolLTR, line, gameInstance, 'LTR');
            if (LTRResult.isWinningLine && LTRResult.matchCount >= 3) {
                const symbolMultiplierLTR = accessData(firstSymbolLTR, LTRResult.matchCount, gameInstance);
                if (symbolMultiplierLTR > 0) {
                    const payout = symbolMultiplierLTR * gameInstance.settings.BetPerLines;
                    totalPayout += payout;
                    gameInstance.playerData.currentWining += payout;
                    settings._winData.winningLines.push(index + 1);
                    winningLines.push({
                        line,
                        symbol: firstSymbolLTR,
                        multiplier: symbolMultiplierLTR,
                        matchCount: LTRResult.matchCount,
                        direction: 'LTR'
                    });
                    const formattedIndices = LTRResult.matchedIndices.map(({ col, row }) => `${col},${row}`);
                    const validIndices = formattedIndices.filter((index) => index.length > 2);
                    if (validIndices.length > 0) {
                        console.log(validIndices);
                        settings._winData.winningSymbols.push(validIndices);
                        settings._winData.totalWinningAmount = totalPayout * settings.BetPerLines;
                        console.log(settings._winData.totalWinningAmount);
                    }
                    console.log(`Line ${index + 1} (LTR):`, line);
                    console.log(`Payout for LTR Line ${index + 1}:`, "payout", payout);
                    return;
                }
            }
            // Right-to-left check
            const RTLResult = checkLineSymbols(firstSymbolRTL, line, gameInstance, 'RTL');
            if (RTLResult.isWinningLine && RTLResult.matchCount >= 3) {
                const symbolMultiplierRTL = accessData(firstSymbolRTL, RTLResult.matchCount, gameInstance);
                if (symbolMultiplierRTL > 0) {
                    const payout = symbolMultiplierRTL * gameInstance.settings.BetPerLines;
                    totalPayout += payout;
                    gameInstance.playerData.currentWining += payout;
                    settings._winData.winningLines.push(index + 1);
                    winningLines.push({
                        line,
                        symbol: firstSymbolRTL,
                        multiplier: symbolMultiplierRTL,
                        matchCount: RTLResult.matchCount,
                        direction: 'RTL'
                    });
                    const formattedIndices = RTLResult.matchedIndices.map(({ col, row }) => `${col},${row}`);
                    const validIndices = formattedIndices.filter((index) => index.length > 2);
                    if (validIndices.length > 0) {
                        console.log(validIndices);
                        settings._winData.winningSymbols.push(validIndices);
                        settings._winData.totalWinningAmount = totalPayout * settings.BetPerLines;
                        console.log(settings._winData.totalWinningAmount);
                    }
                    console.log(`Line ${index + 1} (RTL):`, line);
                    console.log(`Payout for RTL Line ${index + 1}:`, "payout", payout);
                }
            }
        });
        gameInstance.playerData.currentWining = totalPayout;
        return winningLines;
    }
    catch (error) {
        console.error("Error in checkForWin:", error);
        return [];
    }
}
function checkLineSymbols(firstSymbol, line, gameInstance, direction = 'LTR') {
    try {
        const { settings } = gameInstance;
        const wildSymbol = settings.wild.SymbolID || "";
        let matchCount = 1;
        let currentSymbol = firstSymbol;
        let isWild = firstSymbol === wildSymbol;
        const matchedIndices = [];
        const start = direction === 'LTR' ? 0 : line.length - 1;
        const end = direction === 'LTR' ? line.length : -1;
        const step = direction === 'LTR' ? 1 : -1;
        matchedIndices.push({ col: start, row: line[start] });
        for (let i = start + step; i !== end; i += step) {
            const rowIndex = line[i];
            const symbol = settings.resultSymbolMatrix[rowIndex][i];
            if (symbol === wildSymbol) {
                isWild = true;
            }
            if (symbol === undefined) {
                console.error(`Symbol at position [${rowIndex}, ${i}] is undefined.`);
                return { isWinningLine: false, matchCount: 0, matchedIndices: [], isWild };
            }
            switch (true) {
                case symbol === currentSymbol || symbol === wildSymbol:
                    matchCount++;
                    matchedIndices.push({ col: i, row: rowIndex });
                    break;
                case currentSymbol === wildSymbol:
                    currentSymbol = symbol;
                    matchCount++;
                    matchedIndices.push({ col: i, row: rowIndex });
                    break;
                default:
                    return { isWinningLine: matchCount >= 3, matchCount, matchedIndices, isWild };
            }
        }
        return { isWinningLine: matchCount >= 3, matchCount, matchedIndices, isWild };
    }
    catch (error) {
        console.error("Error in checkLineSymbols:", error);
        return { isWinningLine: false, matchCount: 0, matchedIndices: [], isWild: false };
    }
}
//checking first non wild symbol in lines which start with wild symbol
function findFirstNonWildSymbol(line, gameInstance, direction = 'LTR') {
    const { settings } = gameInstance;
    const wildSymbol = settings.wild.SymbolID;
    const start = direction === 'LTR' ? 0 : line.length - 1;
    const end = direction === 'LTR' ? line.length : -1;
    const step = direction === 'LTR' ? 1 : -1;
    for (let i = start; i !== end; i += step) {
        const rowIndex = line[i];
        const symbol = settings.resultSymbolMatrix[rowIndex][i];
        if (symbol !== wildSymbol) {
            return symbol;
        }
    }
    return wildSymbol;
}
function wildExpansion(gameInstance) {
    const { settings } = gameInstance;
    if (settings.isWildExpandedReels.length === 2) {
        console.log("Wild expansion limit reache");
        return;
    }
    const originalReels = {};
    console.log("Original Matrix ", JSON.stringify(settings.resultSymbolMatrix));
    for (let reelIndex = 1; reelIndex <= 3; reelIndex++) {
        if (settings.isWildExpandedReels.includes(reelIndex)) {
            continue;
        }
        if (settings.resultSymbolMatrix.some(row => row[reelIndex] === settings.wild.SymbolID)) {
            settings.isWildExpanded = true;
            originalReels[reelIndex] = settings.resultSymbolMatrix.map(row => row[reelIndex]);
            settings.resultSymbolMatrix.forEach(row => {
                row[reelIndex] = settings.wild.SymbolID;
            });
            console.log(`Reel ${reelIndex} changed to all wild symbols.`);
            settings.isWildExpandedReels.push(reelIndex);
            if (settings.isWildExpandedReels.length === 2) {
                console.log("limit reached ");
                break;
            }
        }
        else {
            console.log(`No wild detected ${reelIndex}.`);
        }
    }
    if (!settings.isWildExpanded) {
        console.log("No wild symbols detected or expanded.");
        return;
    }
    checkForWin(gameInstance);
    makeResultJson(gameInstance);
}
//payouts to user according to symbols count in matched lines
function accessData(symbol, matchCount, gameInstance) {
    const { settings } = gameInstance;
    try {
        const symbolData = settings.currentGamedata.Symbols.find((s) => s.Id.toString() === symbol.toString());
        if (symbolData) {
            const multiplierArray = symbolData.multiplier;
            if (multiplierArray && multiplierArray[5 - matchCount]) {
                return multiplierArray[5 - matchCount][0];
            }
        }
        return 0;
    }
    catch (error) {
        // console.error("Error in accessData:");
        return 0;
    }
}
/**
 * Sends the initial game and player data to the client.
 * @param gameInstance - The instance of the SLCM class containing the game settings and player data.
 */
function sendInitData(gameInstance) {
    gameInstance.settings.lineData =
        gameInstance.settings.currentGamedata.linesApiData;
    gameUtils_1.UiInitData.paylines = (0, gameUtils_1.convertSymbols)(gameInstance.settings.Symbols);
    const reels = generateInitialReel(gameInstance.settings);
    gameInstance.settings.reels = reels;
    const dataToSend = {
        GameData: {
            Reel: reels,
            linesApiData: gameInstance.settings.currentGamedata.linesApiData,
            Bets: gameInstance.settings.currentGamedata.bets,
        },
        UIData: gameUtils_1.UiInitData,
        PlayerData: {
            Balance: gameInstance.getPlayerData().credits,
        },
    };
    gameInstance.sendMessage("InitData", dataToSend);
}
//MAKERESULT JSON FOR FRONTENT SIDE
function makeResultJson(gameInstance) {
    try {
        const { settings, playerData } = gameInstance;
        const credits = gameInstance.getPlayerData().credits;
        const Balance = credits.toFixed(2);
        const sendData = {
            GameData: {
                resultSymbols: settings.resultSymbolMatrix,
                linesToEmit: settings._winData.winningLines,
                symbolsToEmit: settings._winData.winningSymbols,
            },
            PlayerData: {
                Balance: Balance,
                totalbet: playerData.totalbet,
                haveWon: playerData.haveWon,
                currentWining: settings._winData.totalWinningAmount
            }
        };
        gameInstance.sendMessage('ResultData', sendData);
    }
    catch (error) {
        console.error("Error generating result JSON or sending message:", error);
    }
}
