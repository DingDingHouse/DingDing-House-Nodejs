"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeGameSettings = initializeGameSettings;
exports.generateInitialReel = generateInitialReel;
exports.makePayLines = makePayLines;
exports.sendInitData = sendInitData;
exports.checkForWin = checkForWin;
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
        baseBet: gameData.gameSettings.baseBet,
        BetMultiplier: gameData.gameSettings.betMultiplier,
        Symbols: gameInstance.initSymbols,
        resultSymbolMatrix: [],
        currentGamedata: gameData.gameSettings,
        lineData: [],
        _winData: new WinData_1.WinData(gameInstance),
        currentBet: 0,
        baseBetAmount: gameData.gameSettings.baseBet,
        currentLines: 0,
        BetPerLines: 0,
        reels: [],
        freeSpin: {
            symbolID: "-1",
            freeSpinsAdded: false,
            freeSpinCount: 0,
            useFreeSpin: false,
        },
        replacedToWildIndices: [],
        wild: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        bonus: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        stickyBonus: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        mystery: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        moonMystery: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        mini: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        minor: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        major: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        moon: {
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
        for (let i = 0; i < 4; i++) {
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
/**
 * Configures paylines based on the game's settings and handles special symbols.
 * @param gameInstance - The instance of the game.
 */
function makePayLines(gameInstance) {
    const { settings } = gameInstance;
    settings.currentGamedata.Symbols.forEach((element) => {
        if (!element.useWildSub) {
            handleSpecialSymbols(element, gameInstance);
        }
    });
}
/**
 * Sends initial game and player data to the client.
 * @param gameInstance - The instance of the game containing settings and player data.
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
            baseBet: gameInstance.settings.baseBetAmount,
            betMultiplier: gameInstance.settings.currentGamedata.betMultiplier
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
/**
 * Checks for wins on paylines, processes free spins, and updates game state.
 * @param gameInstance - The instance of the game.
 * @returns An array of winning lines.
 */
function checkForWin(gameInstance) {
    try {
        const { settings } = gameInstance;
        const winningLines = [];
        let totalPayout = 0;
        const { isFreeSpin, scatterCount } = checkForFreeSpin(gameInstance);
        if (isFreeSpin) {
            handleFreeSpins(scatterCount, gameInstance);
        }
        const validWinSymbols = countOccurenceOfSymbols(gameInstance);
        console.log(validWinSymbols, "validWinSymbols");
        validWinSymbols.map(([symbol, matchCount]) => {
            const multiplier = accessData(symbol, matchCount, gameInstance);
            console.log(multiplier);
            const payout = multiplier * settings.BetPerLines;
            totalPayout += payout;
        });
        console.log(totalPayout, "payout");
        if (settings.freeSpin.useFreeSpin && settings.freeSpin.freeSpinCount > 0) {
            settings.freeSpin.freeSpinCount -= 1;
            if (settings.freeSpin.freeSpinCount <= 0) {
                settings.freeSpin.useFreeSpin = false;
            }
        }
        if (isFreeSpin) {
            settings.freeSpin.useFreeSpin = true;
        }
        gameInstance.playerData.currentWining += totalPayout;
        gameInstance.playerData.haveWon += gameInstance.playerData.currentWining;
        gameInstance.updatePlayerBalance(gameInstance.playerData.currentWining);
        makeResultJson(gameInstance);
        settings._winData.totalWinningAmount = 0;
        gameInstance.playerData.currentWining = 0;
        settings._winData.winningLines = [];
        settings._winData.winningSymbols = [];
        settings.replacedToWildIndices = [];
        settings.freeSpin.freeSpinsAdded = false;
        return winningLines;
    }
    catch (error) {
        console.error("Error in checkForWin", error);
        return [];
    }
}
function countOccurenceOfSymbols(gameInstance) {
    const { settings } = gameInstance;
    const counts = {};
    let wildCount = 0;
    for (let row of settings.resultSymbolMatrix) {
        for (let num of row) {
            if (num === settings.wild.SymbolID) {
                wildCount++;
                continue;
            }
            counts[num] = (counts[num] || 0) + 1;
        }
    }
    //add wild count to eligible symbols
    settings.Symbols.forEach((symbol) => {
        if (symbol.useWildSub && symbol.Id in counts) {
            counts[symbol.Id] += wildCount;
        }
    });
    //symbols whose count are 8 or more
    const validWinSymbols = Object.entries(counts)
        .filter(([_, count]) => count >= 8);
    return validWinSymbols;
}
/**
 * Retrieves the multiplier associated with a symbol and match count.
 * @param symbol - The symbol for which the multiplier is retrieved.
 * @param matchCount - The number of matching symbols.
 * @param gameInstance - The game instance containing symbol data.
 * @returns The multiplier value or 0 if no data is found.
 */
function accessData(symbol, matchCount, gameInstance) {
    const { settings } = gameInstance;
    try {
        const symbolData = settings.currentGamedata.Symbols.find((s) => s.Id.toString() === symbol.toString());
        if (symbolData) {
            const multiplierArray = symbolData.multiplier;
            if (multiplierArray && multiplierArray[16 - matchCount]) {
                return multiplierArray[16 - matchCount][0];
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
function handleSpecialSymbols(symbol, gameInstance) {
    switch (symbol.Name) {
        case types_1.specialIcons.wild:
            gameInstance.settings.wild.SymbolName = symbol.Name;
            gameInstance.settings.wild.SymbolID = symbol.Id;
            gameInstance.settings.wild.useWild = true;
            break;
        case types_1.specialIcons.bonus:
            gameInstance.settings.bonus.SymbolName = symbol.Name;
            gameInstance.settings.bonus.SymbolID = symbol.Id;
            gameInstance.settings.bonus.useWild = true;
            break;
        case types_1.specialIcons.stickyBonus:
            gameInstance.settings.stickyBonus.SymbolName = symbol.Name;
            gameInstance.settings.stickyBonus.SymbolID = symbol.Id;
            gameInstance.settings.stickyBonus.useWild = true;
            break;
        case types_1.specialIcons.mystery:
            gameInstance.settings.mystery.SymbolName = symbol.Name;
            gameInstance.settings.mystery.SymbolID = symbol.Id;
            gameInstance.settings.mystery.useWild = false;
            break;
        case types_1.specialIcons.moonMystery:
            gameInstance.settings.moonMystery.SymbolName = symbol.Name;
            gameInstance.settings.moonMystery.SymbolID = symbol.Id;
            gameInstance.settings.moonMystery.useWild = false;
            break;
        case types_1.specialIcons.mini:
            gameInstance.settings.mini.SymbolName = symbol.Name;
            gameInstance.settings.mini.SymbolID = symbol.Id;
            gameInstance.settings.mini.useWild = false;
            break;
        case types_1.specialIcons.minor:
            gameInstance.settings.minor.SymbolName = symbol.Name;
            gameInstance.settings.minor.SymbolID = symbol.Id;
            gameInstance.settings.minor.useWild = false;
            break;
        case types_1.specialIcons.major:
            gameInstance.settings.major.SymbolName = symbol.Name;
            gameInstance.settings.major.SymbolID = symbol.Id;
            gameInstance.settings.major.useWild = false;
            break;
        case types_1.specialIcons.moon:
            gameInstance.settings.moon.SymbolName = symbol.Name;
            gameInstance.settings.moon.SymbolID = symbol.Id;
            gameInstance.settings.moon.useWild = false;
            break;
        default:
            break;
            ``;
    }
}
/**
 * Checks if there are enough scatter symbols in the reels to trigger free spins.
 * @param gameInstance - The instance of the SLSM class containing the game state and settings.
 * @returns An object indicating whether free spins are triggered and the count of scatter symbols.
 */
function checkForFreeSpin(gameInstance) {
    const { resultSymbolMatrix } = gameInstance.settings;
    let scatterCount = 0;
    // for (let i = 0; i <= 6; i++) {
    //     const reel = resultSymbolMatrix[i];
    //     scatterCount += reel.filter(symbol => symbol === scatter.symbolID).length;
    // }
    const isFreeSpin = scatterCount >= 3;
    console.log(`Scatter Count: ${scatterCount}`);
    console.log(`Free Spin Triggered: ${isFreeSpin}`);
    return { isFreeSpin, scatterCount };
}
/**
 * Handles the logic for awarding free spins based on the number of scatter symbols.
 * Updates the free spin count and optionally awards winnings based on the current bet.
 * @param scatterCount - The number of scatter symbols found.
 * @param gameInstance - The instance of the SLSM class containing the game state and settings.
 */
function handleFreeSpins(scatterCount, gameInstance) {
    const { settings, playerData } = gameInstance;
    if (settings.freeSpin.useFreeSpin === true) {
        settings.freeSpin.freeSpinsAdded = true;
    }
    switch (true) {
        case scatterCount >= 5:
            settings.freeSpin.freeSpinCount += 50;
            playerData.currentWining += settings.currentBet * 50;
            break;
        case scatterCount === 4:
            settings.freeSpin.freeSpinCount += 25;
            playerData.currentWining += settings.currentBet * 10;
            break;
        case scatterCount === 3:
            settings.freeSpin.freeSpinCount += 10;
            break;
        default:
            // No Free Spins awarded or case not handled
            break;
    }
}
/**
 * Prepares and sends the result data for the current game state to the client.
 * Includes game data, player data, and details of any free spins or winnings.
 * @param gameInstance - The instance of the SLSM class containing the game state and settings.
 */
function makeResultJson(gameInstance) {
    try {
        const { settings, playerData } = gameInstance;
        const credits = gameInstance.getPlayerData().credits + playerData.currentWining;
        const Balance = credits.toFixed(2);
        const sendData = {
            GameData: {
                ResultReel: settings.resultSymbolMatrix,
                linesToEmit: settings._winData.winningLines,
                symbolsToEmit: settings._winData.winningSymbols,
                wildSymbolIndices: settings.replacedToWildIndices,
                isFreeSpin: settings.freeSpin.useFreeSpin,
                freeSpinCount: settings.freeSpin.freeSpinCount,
                freeSpinAdded: settings.freeSpin.freeSpinsAdded
            },
            PlayerData: {
                Balance: gameInstance.getPlayerData().credits,
                currentWining: playerData.currentWining,
                totalbet: playerData.totalbet,
                haveWon: playerData.haveWon,
            }
        };
        gameInstance.sendMessage('ResultData', sendData);
        console.log(sendData, "send Data");
    }
    catch (error) {
        console.error("Error generating result JSON or sending message:", error);
    }
}
