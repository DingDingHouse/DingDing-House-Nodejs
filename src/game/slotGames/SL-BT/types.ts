import { GameData } from "../BaseSlotGame/gameType";
import { WinData } from "../BaseSlotGame/WinData";

interface Symbol {
    Name: string;
    Id: number;
    payout: number;
    reelInstance: { [key: string]: number };
}
export interface SLBTSETTINGS {
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
    freeSpinData: any[][],
    wildSymbolMultipliers: any[],
    WildMultiplier: any[],
    WildMultiplierProb: any[],
    fsWinningSymbols: any[],
    jackpot: {
        symbolName: string;
        symbolsCount: number;
        symbolId: number;
        defaultAmount: number;
        increaseValue: number;
        useJackpot: boolean;
    },
    freeSpin: {
        symbolID: string,
        freeSpinMuiltiplier: any[],
        freeSpinStarted: boolean,
        freeSpinCount: number,
        isNewAdded: number,
        useFreeSpin: boolean,
        freeSpinsAdded: boolean,
    };
    wild: {
        SymbolName: string;
        SymbolID: number;
        useWild: boolean
    }
}


export enum specialIcons {
    jackpot = "Jackpot",
    wild = "Wild",
    FreeSpin = "FreeSpin"
}