import { GameData } from "../BaseSlotGame/gameType";
import { WinData } from "../BaseSlotGame/WinData";

interface Symbol {
    Name: string;
    Id: number;
    payout: number;
    reelInstance: { [key: string]: number };
}
export interface SLSRSETTINGS {
    id: string;
    matrix: { x: number, y: number };
    currentGamedata: GameData;
    resultSymbolMatrix: any[];
    lineData: any[],
    _winData: WinData | undefined;
    currentBet: number;
    currentLines: number;
    BetPerLines: number;
    bets: number[];
    reels: any[][];
    Symbols: Symbol[];
    freeSpinValue: number;
    bonusValuesArray: number[];
    bonusProbabilities: number[];
    multiplierArray: number[];
    multiplierProbabilities: number[];
    shuffledBonusValues: number[];
    selectedMultiplier: number;
    isNewAdded: boolean,
    isFreeSpinRunning: boolean;
    freeSpinTemp: number;
    scatterWinningSymbols: any[];
    trashForCashWinningSymbols: any[];
    freeSpin: {
        symbolID: string,
        freeSpinMuiltiplier: any[],
        freeSpinStarted: boolean,
        freeSpinCount: number,
        noOfFreeSpins: number,
        useFreeSpin: boolean,
        freeSpinsAdded: boolean,
    },
    wild: {
        SymbolName: string;
        SymbolID: number;
        useWild: boolean
    },
    scatter: {
        symbolID: string,
        multiplier: number[],
        useScatter: boolean,
    },
    bonus: {
        start: boolean;
        stopIndex: number;
        game: any;
        id: number;
        symbolCount: number,
        pay: number,
        useBonus: boolean,
    };
}


export enum specialIcons {
    jackpot = "Jackpot",
    wild = "Wild",
    FreeSpin = "FreeSpin",
    scatter = "Scatter",
    bonus = "Bonus"

}


