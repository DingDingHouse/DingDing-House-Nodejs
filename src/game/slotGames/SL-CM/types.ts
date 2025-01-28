import { GameData } from "../BaseSlotGame/gameType";
import { WinData } from "../BaseSlotGame/WinData";

export interface Symbol {
    Name: string;
    Id: number;
    payout: string;
    canCallRedSpin: boolean;
    canCallRespin: boolean;
    reelInstance: { [key: string]: number };
}

export interface CMSettings {
    id: string;
    isSpecial: boolean;
    matrix: { x: number, y: number };
    currentGamedata: GameData;
    resultSymbolMatrix: any[];
    _winData: WinData | undefined;
    currentBet: number;
    currentLines: number;
    BetPerLines: number;
    bets: number[];
    reels: any[][];
    hasreSpin: boolean,
    hasredSpin: boolean,
    specialSpins: any[],
    Symbols: Symbol[];
    results: string[][];
    probabilities: number[];
    lastReSpin: any[];
    freezeIndex: number[];
    newMatrix: any[];
    initialRedRespinMatrix?: any[];
    redspinprobability: number,
}

export enum SPINTYPES {
    RESPIN = 'reSpin',
    REDRESPIN = 'redReSpin'
}

export enum SPECIALSYMBOLS {
    DOUBLEZERO = 'doubleZero',
    ZERO = '0',
    ONE = '1',
    TWO = '2',
    FIVE = '5'
}