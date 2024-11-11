"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeGameSettings = initializeGameSettings;
exports.generateInitialReel = generateInitialReel;
exports.makePayLines = makePayLines;
exports.checkForWin = checkForWin;
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
        bets: gameData.gameSettings.bets,
        Symbols: gameInstance.initSymbols,
        resultSymbolMatrix: [],
        currentGamedata: gameData.gameSettings,
        lineData: [],
        _winData: new WinData_1.WinData(gameInstance),
        currentBet: 0,
        currentLines: 0,
        BetPerLines: 0,
        reels: [],
        hasCascading: false,
        cascadingNo: 0,
        payoutAfterCascading: 0,
        cascadingResult: [],
        lastReel: [],
        tempReel: [],
        firstReel: [],
        tempReelSym: [],
        freeSpinData: gameData.gameSettings.freeSpinData,
        jackpot: {
            symbolName: "",
            symbolsCount: 0,
            symbolId: 0,
            defaultAmount: 0,
            increaseValue: 0,
            useJackpot: false,
        },
        freeSpin: {
            symbolID: "-1",
            freeSpinMuiltiplier: [],
            freeSpinStarted: false,
            freeSpinsAdded: false,
            freeSpinCount: 0,
            noOfFreeSpins: 0,
            useFreeSpin: false,
        },
        wild: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
    };
}
/**
 * Generates the initial reel setup based on the game settings.
 * @param gameSettings - The settings used to generate the reel setup.
 * @returns A 2D array representing the reels, where each sub-array corresponds to a reel.
 */
function generateInitialReel(gameSettings) {
    const reels = [[], [], [], [], [], [], []];
    gameSettings.Symbols.forEach((symbol) => {
        for (let i = 0; i < 7; i++) {
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
        case types_1.specialIcons.jackpot:
            gameInstance.settings.jackpot.symbolName;
            gameInstance.settings.jackpot.symbolId = symbol.Id;
            gameInstance.settings.jackpot.symbolsCount = symbol.symbolsCount;
            gameInstance.settings.jackpot.defaultAmount = symbol.defaultAmount;
            gameInstance.settings.jackpot.increaseValue = symbol.increaseValue;
            gameInstance.settings.jackpot.useJackpot = true;
            break;
        case types_1.specialIcons.wild:
            gameInstance.settings.wild.SymbolName = symbol.Name;
            gameInstance.settings.wild.SymbolID = symbol.Id;
            gameInstance.settings.wild.useWild = true;
            break;
        default:
            break;
            ``;
    }
}
//CHECK WINS ON PAYLINES WITH OR WITHOUT WILD
//check for win function
function checkForWin(gameInstance) {
    try {
        const { settings } = gameInstance;
        if (settings.cascadingNo === 0) {
            settings.firstReel = [...settings.resultSymbolMatrix.map(row => [...row])]; // Deep copy to preserve the original matrix
        }
        const winningLines = [];
        let totalPayout = 0;
        settings.lineData.forEach((line, index) => {
            const firstSymbolPosition = line[0];
            let firstSymbol = settings.resultSymbolMatrix[firstSymbolPosition][0];
            // Handle wild symbols
            if (settings.wild.useWild && firstSymbol === settings.wild.SymbolID) {
                firstSymbol = findFirstNonWildSymbol(line, gameInstance);
            }
            // Handle special icons
            if (Object.values(types_1.specialIcons).includes(settings.Symbols[firstSymbol].Name)) {
                return;
            }
            const { isWinningLine, matchCount, matchedIndices } = checkLineSymbols(firstSymbol, line, gameInstance);
            switch (true) {
                case isWinningLine && matchCount >= 3:
                    const symbolMultiplier = accessData(firstSymbol, matchCount, gameInstance);
                    settings.lastReel = settings.resultSymbolMatrix;
                    console.log(settings.lastReel, 'lastReel');
                    switch (true) {
                        case symbolMultiplier > 0:
                            totalPayout += symbolMultiplier;
                            settings._winData.winningLines.push(index + 1);
                            winningLines.push({
                                line,
                                symbol: firstSymbol,
                                multiplier: symbolMultiplier,
                                matchCount,
                            });
                            console.log(`Line ${index + 1}:`, line);
                            console.log(`Payout for Line ${index + 1}:`, "payout", symbolMultiplier);
                            const formattedIndices = matchedIndices.map(({ col, row }) => `${col},${row}`);
                            const validIndices = formattedIndices.filter((index) => index.length > 2);
                            if (validIndices.length > 0) {
                                // console.log(settings.lastReel, 'settings.lastReel')
                                console.log(validIndices);
                                settings._winData.winningSymbols.push(validIndices);
                                settings._winData.totalWinningAmount = totalPayout * settings.BetPerLines;
                                console.log(settings._winData.totalWinningAmount);
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                default:
                    break;
            }
        });
        return winningLines;
    }
    catch (error) {
        console.error("Error in checkForWin", error);
        return [];
    }
}
//checking matching lines with first symbol and wild subs
function checkLineSymbols(firstSymbol, line, gameInstance) {
    try {
        const { settings } = gameInstance;
        const wildSymbol = settings.wild.SymbolID || "";
        let matchCount = 1;
        let currentSymbol = firstSymbol;
        const matchedIndices = [
            { col: 0, row: line[0] },
        ];
        for (let i = 1; i < line.length; i++) {
            const rowIndex = line[i];
            const symbol = settings.resultSymbolMatrix[rowIndex][i];
            if (symbol === undefined) {
                console.error(`Symbol at position [${rowIndex}, ${i}] is undefined.`);
                return { isWinningLine: false, matchCount: 0, matchedIndices: [] };
            }
            switch (true) {
                case symbol == currentSymbol || symbol === wildSymbol:
                    matchCount++;
                    matchedIndices.push({ col: i, row: rowIndex });
                    break;
                case currentSymbol === wildSymbol:
                    currentSymbol = symbol;
                    matchCount++;
                    matchedIndices.push({ col: i, row: rowIndex });
                    break;
                default:
                    return { isWinningLine: matchCount >= 3, matchCount, matchedIndices };
            }
        }
        return { isWinningLine: matchCount >= 3, matchCount, matchedIndices };
    }
    catch (error) {
        console.error("Error in checkLineSymbols:", error);
        return { isWinningLine: false, matchCount: 0, matchedIndices: [] };
    }
}
//checking first non wild symbol in lines which start with wild symbol
function findFirstNonWildSymbol(line, gameInstance) {
    try {
        const { settings } = gameInstance;
        const wildSymbol = settings.wild.SymbolID;
        for (let i = 0; i < line.length; i++) {
            const rowIndex = line[i];
            const symbol = settings.resultSymbolMatrix[rowIndex][i];
            if (symbol !== wildSymbol) {
                return symbol;
            }
        }
        return wildSymbol;
    }
    catch (error) {
        // console.error("Error in findFirstNonWildSymbol:");
        return null;
    }
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
            freeSpinData: gameInstance.settings.freeSpinData,
        },
        UIData: gameUtils_1.UiInitData,
        PlayerData: {
            Balance: gameInstance.getPlayerData().credits,
            haveWon: gameInstance.playerData.haveWon,
            currentWining: gameInstance.playerData.currentWining,
            totalbet: gameInstance.playerData.totalbet,
        },
    };
    gameInstance.sendMessage("InitData", dataToSend);
}
function makeResultJson(gameInstance) {
    try {
        const { settings, playerData } = gameInstance;
        const credits = gameInstance.getPlayerData().credits + settings.payoutAfterCascading;
        const Balance = credits.toFixed(2);
        const sendData = {
            GameData: {
                resultSymbols: settings.firstReel,
                linesToEmit: settings._winData.winningLines,
                symbolsToEmit: settings._winData.winningSymbols,
                jackpot: settings._winData.jackpotwin,
                cascading: settings.cascadingResult,
                isCascading: settings.hasCascading,
                isFreeSpin: settings.freeSpin.useFreeSpin,
                freeSpinCount: settings.freeSpin.freeSpinCount,
            },
            PlayerData: {
                Balance: Balance,
                currentWining: settings.payoutAfterCascading,
                totalbet: playerData.totalbet,
                haveWon: playerData.haveWon,
            }
        };
        gameInstance.sendMessage('ResultData', sendData);
    }
    catch (error) {
        console.error("Error generating result JSON or sending message:", error);
    }
}
