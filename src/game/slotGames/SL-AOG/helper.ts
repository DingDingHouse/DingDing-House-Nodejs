import { WinData } from "../BaseSlotGame/WinData";
import {
  convertSymbols,
  UiInitData,
} from "../../Utils/gameUtils";
import { specialIcons } from "./types";
import { precisionRound } from "../../../utils/utils";
import { SLAOG } from "./AgeOfGodsBase";

/**
 * Initializes the game settings using the provided game data and game instance.
 * @param gameData - The data used to configure the game settings.
 * @param gameInstance - The instance of the SLBOD class that manages the game logic.
 * @returns An object containing initialized game settings.
 */
export function initializeGameSettings(gameData: any, gameInstance: SLAOG) {
  return {
    id: gameData.gameSettings.id,
    matrix: gameData.gameSettings.matrix,
    currentGamedata: gameData.gameSettings,
    resultSymbolMatrix: [],
    bets: gameData.gameSettings.bets,
    Symbols: gameInstance.initSymbols,
    lineData: [],
    _winData: new WinData(gameInstance),
    currentBet: 0,
    currentLines: 0,
    BetPerLines: 0,
    reels: [],
    freeSpinIncrement: gameData.gameSettings.freespinIncrement || 10,
    wheelProb: gameData.gameSettings.wheelProb,
    goldSymbolProb: gameData.gameSettings.goldSymbolProb,
    isFreeSpin: false,
    freeSpinCount: 0,
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
export function generateInitialReel(gameSettings: any): string[][] {
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
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Creates special symbols in the game based on the game settings.
 * @param gameInstance - The instance of the SLBOD class that manages the game logic.
 */
export function makePayLines(gameInstance: SLAOG) {
  const { settings } = gameInstance;
  settings.currentGamedata.Symbols.forEach((element) => {
    // if (!element.useWildSub) {
    handleSpecialSymbols(element, gameInstance);
    // }
  });
}
function handleSpecialSymbols(symbol: any, gameInstance: SLAOG) {
  switch (symbol.Name) {
    case specialIcons.wild:
      gameInstance.settings.wild.SymbolName = symbol.Name;
      gameInstance.settings.wild.SymbolID = symbol.Id;
      gameInstance.settings.wild.useWild = false
      break;
    default:
      break;
  }
}

//checking matching lines with first symbol and wild subs
type MatchedIndex = { col: number; row: number };
type CheckLineResult = { isWinningLine: boolean; matchCount: number; matchedIndices: MatchedIndex[], isWild: boolean };
type WinningLineDetail = { direction: 'LTR' | 'RTL'; lineIndex: number; details: CheckLineResult };
/**
 * Checks if a line has a winning combination of symbols.
 * @param firstSymbol - The first symbol in the line.
 * @param line - The line to be checked.
 * @param gameInstance - The instance of the SLBOD class that manages the game logic.
 * @returns An object containing information about the winning line.
 */
function checkLineSymbols(
  firstSymbol: string,
  line: number[],
  gameInstance: SLAOG,
  direction: 'LTR' | 'RTL' = 'LTR'
): CheckLineResult {
  try {
    const { settings } = gameInstance;
    const wildSymbol = settings.wild.SymbolID || "";
    let matchCount = 1;
    let currentSymbol = firstSymbol;
    let isWild = firstSymbol === wildSymbol
    const matchedIndices: MatchedIndex[] = [];
    const start = direction === 'LTR' ? 0 : line.length - 1;
    const end = direction === 'LTR' ? line.length : -1;
    const step = direction === 'LTR' ? 1 : -1;
    matchedIndices.push({ col: start, row: line[start] });
    for (let i = start + step; i !== end; i += step) {
      const rowIndex = line[i];
      const symbol = settings.resultSymbolMatrix[rowIndex][i];
      if (symbol === wildSymbol) {
        isWild = true
      }
      if (symbol === undefined) {
        // console.error(`Symbol at position [${rowIndex}, ${i}] is undefined.`);
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
  } catch (error) {
    console.error("Error in checkLineSymbols:", error);
    return { isWinningLine: false, matchCount: 0, matchedIndices: [], isWild: false };
  }
}
//checking first non wild symbol in lines which start with wild symbol
function findFirstNonWildSymbol(line: number[], gameInstance: SLAOG, direction: 'LTR' | 'RTL' = 'LTR') {
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

//payouts to user according to symbols count in matched lines
function accessData(symbol, matchCount, gameInstance: SLAOG) {
  const { settings } = gameInstance;
  try {
    const symbolData = settings.currentGamedata.Symbols.find(
      (s) => s.Id.toString() === symbol.toString()
    );
    if (symbolData) {
      const multiplierArray = symbolData.multiplier;
      if (multiplierArray && multiplierArray[5 - matchCount]) {
        return multiplierArray[5 - matchCount][0];
      }
    }
    return 0;
  } catch (error) {
    console.error("Error in accessData:");
    return 0;
  }
}

/**
 * Sends the initial game and player data to the client.
 * @param gameInstance - The instance of the SLBOD class containing the game settings and player data.
 */
export function sendInitData(gameInstance: SLAOG) {
  gameInstance.settings.lineData =
    gameInstance.settings.currentGamedata.linesApiData;
  UiInitData.paylines = convertSymbols(gameInstance.settings.Symbols);
  const reels = generateInitialReel(gameInstance.settings);
  gameInstance.settings.reels = reels;
  const dataToSend = {
    GameData: {
      Reel: reels,
      linesApiData: gameInstance.settings.currentGamedata.linesApiData,
      Bets: gameInstance.settings.currentGamedata.bets,
    },
    UIData: UiInitData,
    PlayerData: {
      Balance: gameInstance.getPlayerData().credits,
    },
  };
  gameInstance.sendMessage("InitData", dataToSend);
}
// Helper function to get N random positions
function getNRandomPositions(matrix: string[][], count: number): {
  row: number;
  col: number;
}[] {
  const emptyPositions = getRandomPositions(matrix);
  return emptyPositions.slice(0, count);
}
function getRandomPositions(matrix: string[][]): {
  row: number;
  col: number;
}[] {
  try {
    // Get all positions
    const positions: {
      row: number;
      col: number;
    }[] = [];
    // Collect all positions 
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        positions.push({ row, col });
      }
    }
    // Shuffle the empty positions array using Fisher-Yates algorithm
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    return positions;
  } catch (e) {
    console.log("error in getRandomPositions", e);
    return []; // Return empty array in case of error
  }
}


export function getRandomValue(gameInstance: SLAOG, type:
  'wheelType' |
  'index' |
  'goldForNoWheel' |
  'goldForSmallWheel' |
  'goldForMediumWheel' |
  'goldForLargeWheel'
): number {
  const { settings } = gameInstance;

  let values: number[];
  let probabilities: number[];

  if (type === 'wheelType') {
    values = [0, 1, 2, 3]
    probabilities = settings.wheelProb
  } else if (type === 'index') {
    values = [3, 4, 5, 6, 7, 8]
    probabilities = settings.wheelProb.slice(3)
  } else if (type === 'goldForSmallWheel') {
    values = [3, 4, 5, 6, 7, 8]
    probabilities = settings.wheelProb.slice(3)
  } else if (type === 'goldForMediumWheel') {
    values = [4, 5, 6, 7, 8]
    probabilities = settings.wheelProb.slice(4)
  } else if (type === 'goldForLargeWheel') {
    values = [5, 6, 7, 8]
    probabilities = settings.wheelProb.slice(5)
  } else if (type === 'goldForNoWheel') {
    values = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    probabilities = settings.wheelProb
  } else {
    throw new Error("Invalid type, expected 'coin' or 'freespin'");
  }
  const totalProbability = probabilities.reduce((sum, prob) => sum + prob, 0);
  const randomValue = Math.random() * totalProbability;

  let cumulativeProbability = 0;
  for (let i = 0; i < probabilities.length; i++) {
    cumulativeProbability += probabilities[i];
    if (randomValue < cumulativeProbability) {
      return values[i];
    }
  }
  return values[0];
}

//check if wheel of fortune will be triggered
function checkForWheelOfFortune(gameInstance: SLAOG): number {
  return getRandomValue(gameInstance, 'wheelType')
}
//check how many gold symbols will be spawned
function checkForGoldSymbols(gameInstance: SLAOG, wheelType: 'No' | 'Small' | 'Medium' | 'Large'): number {
  return getRandomValue(gameInstance, `goldFor${wheelType}Wheel`)
}

//CHECK WINS ON PAYLINES WITH OR WITHOUT WILD
export function checkForWin(gameInstance: SLAOG) {
  try {
    const { settings } = gameInstance;

    const winningLines = [];
    let totalPayout = 0;

    if (settings.freeSpinCount > 0) {
      settings.freeSpinCount--
    }


    settings.lineData.forEach((line, index) => {
      const firstSymbolPositionLTR = line[0];
      // const firstSymbolPositionRTL = line[line.length - 1];

      // Get first symbols for both directions
      let firstSymbolLTR = settings.resultSymbolMatrix[firstSymbolPositionLTR][0];
      // let firstSymbolRTL = settings.resultSymbolMatrix[firstSymbolPositionRTL][line.length - 1];

      // Handle wild symbols for both directions
      if (firstSymbolLTR === settings.wild.SymbolID) {
        firstSymbolLTR = findFirstNonWildSymbol(line, gameInstance);
      }
      // if (firstSymbolRTL === settings.wild.SymbolID) {
      //   firstSymbolRTL = findFirstNonWildSymbol(line, gameInstance, 'RTL');
      // }

      // Left-to-right check
      const LTRResult = checkLineSymbols(firstSymbolLTR, line, gameInstance, 'LTR');
      if (LTRResult.isWinningLine && LTRResult.matchCount >= 3) {
        const symbolMultiplierLTR = accessData(firstSymbolLTR, LTRResult.matchCount, gameInstance);
        if (symbolMultiplierLTR > 0) {
          const payout = symbolMultiplierLTR * gameInstance.settings.BetPerLines;
          totalPayout += payout;
          settings._winData.winningLines.push(index + 1);
          winningLines.push({
            line,
            symbol: firstSymbolLTR,
            multiplier: symbolMultiplierLTR,
            matchCount: LTRResult.matchCount,
            direction: 'LTR'
          });
          const formattedIndices = LTRResult.matchedIndices.map(({ col, row }) => `${col},${row}`);
          const validIndices = formattedIndices.filter(
            (index) => index.length > 2
          );
          if (validIndices.length > 0) {
            settings._winData.winningSymbols.push(validIndices);
            settings._winData.totalWinningAmount = precisionRound((totalPayout * settings.BetPerLines), 4);
          }
          return;
        }
      }
    });


    gameInstance.playerData.currentWining = precisionRound(totalPayout, 5);
    gameInstance.playerData.haveWon = precisionRound(gameInstance.playerData.haveWon +
      gameInstance.playerData.currentWining, 5)
    makeResultJson(gameInstance)
    settings.isFreeSpin = false

    settings._winData.winningLines = []
    settings._winData.winningSymbols = []

    return winningLines;
  } catch (error) {
    console.error("Error in checkForWin:", error);
    return [];
  }
}

//MAKERESULT JSON FOR FRONTENT SIDE
export function makeResultJson(gameInstance: SLAOG) {
  try {
    const { settings, playerData } = gameInstance;
    const credits = gameInstance.getPlayerData().credits
    const Balance = credits.toFixed(2)
    const sendData = {
      GameData: {
        resultSymbols: settings.resultSymbolMatrix,
        linesToEmit: settings._winData.winningLines,
        symbolsToEmit: settings._winData.winningSymbols,
        isFreeSpin: settings.isFreeSpin,
        freeSpinCount: settings.freeSpinCount,
      },
      PlayerData: {
        Balance: Balance,
        totalbet: playerData.totalbet,
        haveWon: playerData.haveWon,
        currentWining: playerData.currentWining
      }
    };
    console.log(JSON.stringify(sendData));

    gameInstance.sendMessage('ResultData', sendData);
  } catch (error) {
    console.error("Error generating result JSON or sending message:", error);
  }
}
