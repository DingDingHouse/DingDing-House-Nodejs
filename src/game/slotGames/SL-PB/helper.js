"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeGameSettings = initializeGameSettings;
exports.generateInitialReel = generateInitialReel;
exports.generateInitialBonusReel = generateInitialBonusReel;
exports.makePayLines = makePayLines;
exports.sendInitData = sendInitData;
exports.checkForWin = checkForWin;
exports.getRandomValue = getRandomValue;
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
        BonusSymbols: gameInstance.initBonusSymbols,
        resultSymbolMatrix: [],
        bonusResultMatrix: [],
        tempResultSymbolMatrix: [],
        currentGamedata: gameData.gameSettings,
        lineData: [],
        _winData: new WinData_1.WinData(gameInstance),
        currentBet: 0,
        baseBetAmount: gameData.gameSettings.baseBet,
        currentLines: 0,
        BetPerLines: 0,
        reels: [],
        bonusReels: [],
        stickySymbolCount: gameData.gameSettings.stickyBonusCount,
        stickySymbolCountProb: gameData.gameSettings.stickySymbolCountProb,
        prizeValue: gameData.gameSettings.prizeValue,
        prizeValueProb: gameData.gameSettings.prizeValueProb,
        mysteryValues: gameData.gameSettings.mysteryValues,
        mysteryValueProb: gameData.gameSettings.mysteryValueProb,
        moonMysteryValues: gameData.gameSettings.moonMysteryValues,
        moonMysteryValueProb: gameData.gameSettings.moonMysteryValueProb,
        bonusSymbolValue: [],
        frozenIndices: [],
        miniMultiplier: gameData.gameSettings.miniMultiplier,
        minorMultiplier: gameData.gameSettings.minorMultiplier,
        majorMultiplier: gameData.gameSettings.majorMultiplier,
        grandMultiplier: gameData.gameSettings.grandMultiplier,
        moonMultiplier: gameData.gameSettings.moonMultiplier,
        moonMysteryData: [],
        isMoonJackpot: false,
        isStickyBonusSymbol: false,
        isGrandPrize: false,
        isStickyBonus: false,
        freeSpin: {
            freeSpinsAdded: false,
            freeSpinAwarded: gameData.gameSettings.freeSpinCount,
            freeSpinCount: 0,
            useFreeSpin: false,
            freeSpinPayout: 0
        },
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
        coins: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        arthurBonus: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        tomBonus: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        pollyBonus: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        mini: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        major: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        mega: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        thomas: {
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
 * Generates the initial configuration for bonus reels based on game settings.
 * @param gameSettings - The settings containing the bonus symbols and their reel configurations.
 * @returns A 2D array representing the shuffled bonus reels.
 */
function generateInitialBonusReel(gameSettings) {
    const reels = [[], [], [], [], [], [], []];
    gameSettings.BonusSymbols.forEach((symbol) => {
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
    gameSettings.bonusReels = reels;
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
 * Retrieves the multipliers associated with bonus symbols from the game instance.
 * @param gameInstance - The instance of the SLCM class that manages the game logic.
 * @returns An array of objects, each containing the name and value of a bonus symbol multiplier.
 */
function getMultipliersForBonusSymbols(gameInstance) {
    const { settings } = gameInstance;
    const multipliers = [
        { name: "Mini Multiplier", value: settings.miniMultiplier },
        { name: "Minor Multiplier", value: settings.minorMultiplier },
        { name: "Major Multiplier", value: settings.majorMultiplier },
        { name: "Grand Multiplier", value: settings.grandMultiplier },
        { name: "Moon Multiplier", value: settings.moonMultiplier },
    ];
    return multipliers;
}
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
        console.error("Error in findFirstNonWildSymbol:", error);
        return null;
    }
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
    const bonusReels = generateInitialBonusReel(gameInstance.settings);
    const bonusMulipliers = getMultipliersForBonusSymbols(gameInstance);
    gameInstance.settings.reels = reels;
    const dataToSend = {
        GameData: {
            Reel: reels,
            BonusReel: bonusReels,
            linesApiData: gameInstance.settings.currentGamedata.linesApiData,
            Bets: gameInstance.settings.currentGamedata.bets,
            baseBet: gameInstance.settings.baseBetAmount,
            betMultiplier: gameInstance.settings.currentGamedata.betMultiplier,
            specialBonusSymbolMulipliers: bonusMulipliers,
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
 * Checks for a win in the game and handles various game mechanics such as sticky bonuses, free spins, and base game wins.
 * The function performs the following tasks:
 * 1. **Sticky Bonus**: If there are sticky bonus symbols, it decrements their value and freezes the symbol on the grid.
 * 2. **Free Spin Logic**: If free spins are active, it reduces the free spin count and calculates the payout for free spins once they are exhausted.
 * 3. **Base Game Logic**: If free spins are not active, it checks for occurrences of winning symbols on the grid, calculates the corresponding payout, and updates the total payout.
 * 4. **Payout Calculation**: Based on the game state, it calculates the total payout for both free spins and base game wins.
 * 5. **Player Data Update**: Updates the player's current winnings and adds the win amount to the player's balance.
 * 6. **Game State Reset**: Resets relevant game settings and variables to prepare for the next round.
 *
 * @param gameInstance - The instance of the SLPB class managing the game logic.
 */
function checkForWin(gameInstance) {
    try {
        const { settings } = gameInstance;
        const winningLines = [];
        settings.lineData.forEach((line, index) => {
            const firstSymbolPosition = line[0];
            let firstSymbol = settings.resultSymbolMatrix[firstSymbolPosition][0];
            let totalPayout = 0;
            if (settings.wild.useWild && firstSymbol === settings.wild.SymbolID) {
                firstSymbol = findFirstNonWildSymbol(line, gameInstance);
            }
            const { isWinningLine, matchCount, matchedIndices: winMatchedIndices } = checkLineSymbols(firstSymbol, line, gameInstance);
            if ((isWinningLine && matchCount >= 3)) {
                const symbolMultiplier = accessData(firstSymbol, matchCount, gameInstance);
                if (symbolMultiplier > 0) {
                    totalPayout += symbolMultiplier * gameInstance.settings.BetPerLines;
                    gameInstance.playerData.currentWining += totalPayout;
                    settings._winData.winningLines.push(index);
                    winningLines.push({
                        line,
                        symbol: firstSymbol,
                        multiplier: symbolMultiplier,
                        matchCount,
                    });
                    console.log(`Line ${index + 1}:`, line);
                    console.log(`Payout for Line ${index + 1}:`, 'payout', symbolMultiplier);
                    const formattedIndices = winMatchedIndices.map(({ col, row }) => `${col},${row}`);
                    const validIndices = formattedIndices.filter(index => index.length > 2);
                    if (validIndices.length > 0) {
                        gameInstance.settings._winData.winningSymbols.push(validIndices);
                    }
                }
            }
        });
        console.log("Total Winning", gameInstance.playerData.currentWining);
        console.log("Total Free Spins Won:", gameInstance.settings.freeSpin.freeSpinCount);
        gameInstance.playerData.haveWon += gameInstance.playerData.currentWining;
        gameInstance.updatePlayerBalance(gameInstance.playerData.currentWining);
        makeResultJson(gameInstance);
        // Reset properties after result processing
        gameInstance.playerData.currentWining = 0;
        gameInstance.settings._winData.winningLines = [];
        gameInstance.settings._winData.winningSymbols = [];
    }
    catch (error) {
        console.error("Error in checkForWin", error);
        return [];
    }
}
/**
 * Counts the occurrences of symbols and their indices in the result symbol matrix, including handling wild symbol substitutions.
 * Determines valid winning symbols based on their counts and combines indices for symbols to emit winnings.
 *
 * @param gameInstance - The instance of the SLCM class that manages the game logic.
 * @returns An array of valid winning symbols where each entry is a tuple of the symbol ID and its count.
 */
function checkLineSymbols(firstSymbol, line, gameInstance) {
    try {
        const { settings } = gameInstance;
        const wildSymbol = settings.wild.SymbolID || "";
        let matchCount = 1;
        let currentSymbol = firstSymbol;
        const matchedIndices = [{ col: 0, row: line[0] }];
        // Loop through the line
        for (let i = 1; i < line.length; i++) {
            const rowIndex = line[i];
            const symbol = settings.resultSymbolMatrix[rowIndex][i];
            if (symbol === undefined) {
                console.error(`Symbol at position [${rowIndex}, ${i}] is undefined.`);
                return { isWinningLine: false, matchCount: 0, matchedIndices: [] };
            }
            // Check for matches (consider wild symbols)
            if (symbol === currentSymbol || symbol === wildSymbol) {
                matchCount++;
                matchedIndices.push({ col: i, row: rowIndex });
            }
            else if (currentSymbol === wildSymbol) {
                currentSymbol = symbol;
                matchCount++;
                matchedIndices.push({ col: i, row: rowIndex });
            }
            else {
                break;
            }
        }
        return { isWinningLine: matchCount >= 3, matchCount, matchedIndices };
    }
    catch (error) {
        console.error("Error in checkLineSymbols:", error);
        return { isWinningLine: false, matchCount: 0, matchedIndices: [] };
    }
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
 * Configures game settings based on the special symbol provided.
 * Updates the relevant symbol properties in the game instance based on the type of the special symbol.
 *
 * @param symbol - The symbol object containing details such as name and ID.
 * @param gameInstance - The instance of the SLPB class that manages the game logic.
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
        case types_1.specialIcons.coins:
            gameInstance.settings.coins.SymbolName = symbol.Name;
            gameInstance.settings.coins.SymbolID = symbol.Id;
            gameInstance.settings.coins.useWild = true;
            break;
        case types_1.specialIcons.mini:
            gameInstance.settings.mini.SymbolName = symbol.Name;
            gameInstance.settings.mini.SymbolID = symbol.Id;
            gameInstance.settings.mini.useWild = false;
            break;
        case types_1.specialIcons.major:
            gameInstance.settings.major.SymbolName = symbol.Name;
            gameInstance.settings.major.SymbolID = symbol.Id;
            gameInstance.settings.major.useWild = false;
            break;
        case types_1.specialIcons.mega:
            gameInstance.settings.mega.SymbolName = symbol.Name;
            gameInstance.settings.mega.SymbolID = symbol.Id;
            gameInstance.settings.mega.useWild = false;
            break;
        case types_1.specialIcons.arthurBonus:
            gameInstance.settings.arthurBonus.SymbolName = symbol.Name;
            gameInstance.settings.arthurBonus.SymbolID = symbol.Id;
            gameInstance.settings.arthurBonus.useWild = false;
            break;
        case types_1.specialIcons.pollyBonus:
            gameInstance.settings.pollyBonus.SymbolName = symbol.Name;
            gameInstance.settings.pollyBonus.SymbolID = symbol.Id;
            gameInstance.settings.pollyBonus.useWild = false;
            break;
        case types_1.specialIcons.tomBonus:
            gameInstance.settings.tomBonus.SymbolName = symbol.Name;
            gameInstance.settings.tomBonus.SymbolID = symbol.Id;
            gameInstance.settings.tomBonus.useWild = false;
            break;
        case types_1.specialIcons.thomas:
            gameInstance.settings.thomas.SymbolName = symbol.Name;
            gameInstance.settings.thomas.SymbolID = symbol.Id;
            gameInstance.settings.thomas.useWild = false;
            break;
        default:
            break;
            ``;
    }
}
/**
 * Retrieves a random value based on the specified type and its associated probabilities.
 * The function uses weighted probabilities to select a value from a predefined set.
 *
 * @param gameInstance - The instance of the SLPB class that manages the game logic.
 * @param type - The type of random value to retrieve, such as 'sticky', 'prize', 'mystery', or 'moonMystery'.
 * @returns A randomly selected value based on the weighted probabilities for the specified type.
 * @throws An error if an invalid type is provided.
 */
function getRandomValue(gameInstance, type) {
    const { settings } = gameInstance;
    let values;
    let probabilities;
    // determine the values and probabilities based on the type
    if (type === 'sticky') {
        values = settings === null || settings === void 0 ? void 0 : settings.stickySymbolCount;
        probabilities = settings === null || settings === void 0 ? void 0 : settings.stickySymbolCountProb;
    }
    else if (type === 'prize') {
        values = settings === null || settings === void 0 ? void 0 : settings.prizeValue;
        probabilities = settings === null || settings === void 0 ? void 0 : settings.prizeValueProb;
    }
    else if (type === 'mystery') {
        values = settings === null || settings === void 0 ? void 0 : settings.mysteryValues;
        probabilities = settings === null || settings === void 0 ? void 0 : settings.mysteryValueProb;
    }
    else if (type === 'moonMystery') {
        values = settings === null || settings === void 0 ? void 0 : settings.moonMysteryValues;
        probabilities = settings === null || settings === void 0 ? void 0 : settings.moonMysteryValueProb;
    }
    else {
        throw new Error("Invalid type, expected 'coin' or 'freespin'");
    }
    // Calculate the total probability and select a random value
    const totalProbability = probabilities.reduce((sum, prob) => sum + prob, 0);
    const randomValue = Math.random() * totalProbability;
    let cumulativeProbability = 0;
    for (let i = 0; i < probabilities.length; i++) {
        cumulativeProbability += probabilities[i];
        if (randomValue < cumulativeProbability) {
            return values[i];
        }
    }
    //default to first value
    return values[0];
}
/**
 * Checks if free spins are triggered based on the occurrence of bonus symbols in the result symbol matrix.
 * Updates the game settings with bonus symbol values and manages the sticky bonus logic for free spins.
 *
 * @param gameInstance - The instance of the SLPB class that manages the game logic.
 * @returns An object containing the free spin status and the count of bonus symbols.
 */
function checkForFreeSpin(gameInstance) {
    const { resultSymbolMatrix, bonus, freeSpin } = gameInstance.settings;
    // reset frozen indices and count bonus symbols
    gameInstance.settings.frozenIndices = [];
    let bonusSymbolCount = 0;
    const isFreeSpin = 0;
    return { isFreeSpin, bonusSymbolCount };
}
/**
 * Prepares and sends the result data for the current game state to the client.
 * Includes game data, player data, and details of any free spins or winnings.
 * @param gameInstance - The instance of the SLPB class containing the game state and settings.
 */
function makeResultJson(gameInstance) {
    try {
        const { settings, playerData } = gameInstance;
        const credits = gameInstance.getPlayerData().credits + playerData.currentWining;
        const sendData = {
            GameData: {
                ResultReel: settings.resultSymbolMatrix,
                linesToEmit: settings._winData.winningLines,
                symbolsToEmit: settings._winData.winningSymbols,
                isFreeSpin: settings.freeSpin.useFreeSpin,
                freeSpinCount: settings.freeSpin.freeSpinCount,
                freeSpinAdded: settings.freeSpin.freeSpinsAdded,
                frozenIndices: settings.frozenIndices,
                isGrandPrize: settings.isGrandPrize,
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
