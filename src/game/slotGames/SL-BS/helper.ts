import { WinData } from "../BaseSlotGame/WinData";
import {
    convertSymbols,
    UiInitData,
    shuffleArray
} from "../../Utils/gameUtils";
import { SLBS } from "./buffalo777Base"
import { FrozenIndex, specialIcons } from "./types";

/**
 * Initializes the game settings using the provided game data and game instance.
 * @param gameData - The data used to configure the game settings.
 * @param gameInstance - The instance of the SLCM class that manages the game logic.
 * @returns An object containing initialized game settings.
 */

export function initializeGameSettings(gameData: any, gameInstance: SLBS) {
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
        _winData: new WinData(gameInstance),
        currentBet: 0,
        baseBetAmount: gameData.gameSettings.baseBet,
        currentLines: 0,
        BetPerLines: 0,
        reels: [],
        anyMatchCount:gameData.gameSettings.anyPayout,
        freeSpin: {
            freeSpinAwarded: gameData.gameSettings.freeSpinCount,
            freeSpinCount: 0,
            useFreeSpin: false,
            freeSpinPayout: 0,
            freeSpinsAdded: false,

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
        jackpot: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        bar3: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        bar2: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        bar1: {
            SymbolName: "",
            SymbolID: -1,
            useWild: false,
        },
        isJackpot: false
    };
}

/**
 * Generates the initial reel setup based on the game settings.
 * @param gameSettings - The settings used to generate the reel setup.
 * @returns A 2D array representing the reels, where each sub-array corresponds to a reel.
 */

export function generateInitialReel(gameSettings: any): string[][] {
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
 * Configures paylines based on the game's settings and handles special symbols.
 * @param gameInstance - The instance of the game.
 */

export function makePayLines(gameInstance: SLBS) {
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

export function sendInitData(gameInstance: SLBS) {
    gameInstance.settings.lineData =
        gameInstance.settings.currentGamedata.linesApiData;
    const symbols = gameInstance.settings.Symbols        
    UiInitData.paylines = convertSymbols(symbols);
    const reels = generateInitialReel(gameInstance.settings);
    gameInstance.settings.reels = reels;
    const dataToSend = {
        GameData: {
            Reel: reels,
            // BonusReel: bonusReels,
            linesApiData: gameInstance.settings.currentGamedata.linesApiData,
            Bets: gameInstance.settings.currentGamedata.bets,
            baseBet: gameInstance.settings.baseBetAmount,
            betMultiplier: gameInstance.settings.currentGamedata.betMultiplier,

        },
        UIData: UiInitData,
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
 * @param gameInstance - The instance of the SLSM class managing the game logic.
 */

export function checkForWin(gameInstance: SLBS) {
    try {
        const { settings } = gameInstance;

        const winningLines = [];


        if (settings.freeSpin.useFreeSpin && settings.freeSpin.freeSpinCount > 0) {
            settings.freeSpin.freeSpinCount -= 1;
            if (settings.freeSpin.freeSpinCount <= 0) {
                settings.freeSpin.useFreeSpin = false;
            }
        }

        const {iswinning, totalpayout, matchedindices} = checksymbolocuurence(gameInstance);
        //  console.log(totalPayout, "total");
         const formattedIndices = matchedindices.map(({ col, row }) => `${col},${row}`);
         const validIndices = formattedIndices.filter(index => index.length > 2);
         if (validIndices.length > 0) {
             gameInstance.settings._winData.winningSymbols.push(validIndices);

         }

        gameInstance.playerData.currentWining += totalpayout;
        gameInstance.playerData.haveWon = parseFloat(
            (gameInstance.playerData.haveWon + parseFloat(gameInstance.playerData.currentWining.toFixed(4))).toFixed(4)
        );
        gameInstance.updatePlayerBalance(gameInstance.playerData.currentWining);

        makeResultJson(gameInstance)
        settings._winData.totalWinningAmount = 0;
        gameInstance.playerData.currentWining = 0;
        settings.freeSpin.freeSpinPayout = 0;
        settings.freeSpin.freeSpinsAdded = false
        settings._winData.winningSymbols = []
        settings.isJackpot = false;
        settings._winData.winningLines = []

    } catch (error) {
        console.error("Error in checkForWin", error);
        return [];
    }

}




type MatchedIndex = { col: number; row: number };

type matchedindex = { col: number; row: number };

function checksymbolocuurence(gameinstance: SLBS) {
    const { settings } = gameinstance;
    const matchedindices: matchedindex[] = [];
    let totalpayout = 0;
    let iswinning = false; // Track if there's a winning condition

    // Iterate through all lines
    for (let lineIndex = 0; lineIndex < settings.lineData.length; lineIndex++) {
        const line = settings.lineData[lineIndex];

        // Extract the symbols from the matrix based on this line
        const rowSymbols = line.map((row, col) => settings.resultSymbolMatrix[row]?.[col]);

        if (!rowSymbols.every((symbol) => symbol !== undefined)) {
            continue; // Skip invalid lines
        }

        // Check for wilds
        const haswild = rowSymbols.includes(settings.wild.SymbolID);
        if (haswild) {
            const nonwildsymbols = rowSymbols.filter((symbol) => symbol !== settings.wild.SymbolID);
            const allnonwildsame = nonwildsymbols.every((symbol) => symbol === nonwildsymbols[0]);


            if (
                allnonwildsame &&
                nonwildsymbols.length > 0 &&
                nonwildsymbols[0] !== settings.jackpot.SymbolID &&
                nonwildsymbols[0] !== settings.bonus.SymbolID
            ) {
                rowSymbols.fill(nonwildsymbols[0]); // Replace with non-wild symbol
            }
        }

        // Check if all symbols are the same or match special combination
        const allsame = rowSymbols.every((symbol) => symbol === rowSymbols[0]);
        const isspecialcombination = rowSymbols.every((symbol) =>
            [settings.bar3.SymbolID, settings.bar2.SymbolID, settings.bar1.SymbolID].includes(symbol)
        );

        if (allsame || isspecialcombination) {
            iswinning = true; // Mark as winning row
            const matchedsymbol = rowSymbols[0];

            // Handle bonus and free spins
            if (matchedsymbol === settings.bonus.SymbolID) {
                if (!settings.freeSpin.useFreeSpin) {
                    settings.freeSpin.useFreeSpin = true;
                    settings.freeSpin.freeSpinsAdded = true;
                    settings.freeSpin.freeSpinCount = settings.freeSpin.freeSpinAwarded;
                } else {
                    settings.freeSpin.freeSpinCount = settings.freeSpin.freeSpinAwarded;
                    settings.freeSpin.freeSpinsAdded = true;
                }
            }

            // Handle jackpot
            if (matchedsymbol === settings.jackpot.SymbolID) {
                settings.isJackpot = true;
            }

            // Calculate payouts
            if (allsame) {
                const symbol: any = settings.currentGamedata.Symbols.find((symbol) => symbol.Id === matchedsymbol);
                const symbolpayout = parseFloat(symbol?.payout || "0");
                const payout = symbolpayout * settings.BetPerLines;
                totalpayout += payout;
            } else if (isspecialcombination) {
                const payout = settings.anyMatchCount * settings.BetPerLines;
                totalpayout += payout;
            }

            // Save winning line index
            settings._winData.winningLines.push(lineIndex);

            // Save matched indices
            for (let col = 0; col < line.length; col++) {
                matchedindices.push({ col, row: line[col] });
            }
        }
    }

    console.log({ iswinning, totalpayout, matchedindices });

    return { iswinning, totalpayout, matchedindices };
}



/**
 * Configures game settings based on the special symbol provided.
 * Updates the relevant symbol properties in the game instance based on the type of the special symbol.
 * 
 * @param symbol - The symbol object containing details such as name and ID.
 * @param gameInstance - The instance of the SLSM class that manages the game logic.
 */

function handleSpecialSymbols(symbol: any, gameInstance: SLBS) {
    switch (symbol.Name) {
        case specialIcons.wild:
            gameInstance.settings.wild.SymbolName = symbol.Name;
            gameInstance.settings.wild.SymbolID = symbol.Id;
            gameInstance.settings.wild.useWild = true;
            break;
        case specialIcons.bonus:
            gameInstance.settings.bonus.SymbolName = symbol.Name;
            gameInstance.settings.bonus.SymbolID = symbol.Id;
            gameInstance.settings.bonus.useWild = true;
            break;
        case specialIcons.jackpot:
            gameInstance.settings.jackpot.SymbolName = symbol.Name;
            gameInstance.settings.jackpot.SymbolID = symbol.Id;
            gameInstance.settings.jackpot.useWild = false;
            break;
        case specialIcons.bar3:
            gameInstance.settings.bar3.SymbolName = symbol.Name;
            gameInstance.settings.bar3.SymbolID = symbol.Id;
            gameInstance.settings.bar3.useWild = false;
            break;
        case specialIcons.bar2:
            gameInstance.settings.bar2.SymbolName = symbol.Name;
            gameInstance.settings.bar2.SymbolID = symbol.Id;
            gameInstance.settings.bar2.useWild = false;
            break;
        case specialIcons.bar1:
            gameInstance.settings.bar1.SymbolName = symbol.Name;
            gameInstance.settings.bar1.SymbolID = symbol.Id;
            gameInstance.settings.bar1.useWild = false;
            break;
        default:
            break; ``
    }
}



// /**
//  * Retrieves a random value based on the specified type and its associated probabilities.
//  * The function uses weighted probabilities to select a value from a predefined set.
//  * 
//  * @param gameInstance - The instance of the SLSM class that manages the game logic.
//  * @param type - The type of random value to retrieve, such as 'sticky', 'prize', 'mystery', or 'moonMystery'.
//  * @returns A randomly selected value based on the weighted probabilities for the specified type.
//  * @throws An error if an invalid type is provided.
//  */

// export function getRandomValue(gameInstance: SLBS, type: 'sticky' | 'prize' | 'mystery' | 'moonMystery'): number {
//     const { settings } = gameInstance;

//     let values: number[];
//     let probabilities: number[];

//     // determine the values and probabilities based on the type
//     if (type === 'sticky') {
//         values = settings?.stickySymbolCount;
//         probabilities = settings?.stickySymbolCountProb;
//     } else if (type === 'prize') {
//         values = settings?.prizeValue;
//         probabilities = settings?.prizeValueProb;
//     } else if (type === 'mystery') {
//         values = settings?.mysteryValues;
//         probabilities = settings?.mysteryValueProb;
//     } else if (type === 'moonMystery') {
//         values = settings?.moonMysteryValues;
//         probabilities = settings?.moonMysteryValueProb;
//     }
//     else {
//         throw new Error("Invalid type, expected 'coin' or 'freespin'");
//     }


//     // Calculate the total probability and select a random value
//     const totalProbability = probabilities.reduce((sum, prob) => sum + prob, 0);
//     const randomValue = Math.random() * totalProbability;

//     let cumulativeProbability = 0;
//     for (let i = 0; i < probabilities.length; i++) {
//         cumulativeProbability += probabilities[i];
//         if (randomValue < cumulativeProbability) {
//             return values[i];
//         }
//     }

//     //default to first value
//     return values[0];
// }







/**
 * Prepares and sends the result data for the current game state to the client.
 * Includes game data, player data, and details of any free spins or winnings.
 * @param gameInstance - The instance of the SLSM class containing the game state and settings.
 */

export function makeResultJson(gameInstance: SLBS) {
    try {
        const { settings, playerData } = gameInstance;
        const credits = gameInstance.getPlayerData().credits + playerData.currentWining
        const sendData = {
            GameData: {
                ResultReel: settings.resultSymbolMatrix,
                symbolsToEmit: settings._winData.winningSymbols,
                isFreeSpin: settings.freeSpin.useFreeSpin,
                freeSpinCount: settings.freeSpin.freeSpinCount,
                isfreeSpinAdded: settings.freeSpin.freeSpinsAdded,
                isJackpot: settings.isJackpot,
                linesToEmit: settings._winData.winningLines,
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

    } catch (error) {
        console.error("Error generating result JSON or sending message:", error);
    }
}