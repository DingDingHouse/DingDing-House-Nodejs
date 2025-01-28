import { GameData } from "../BaseSlotGame/gameType";
import { WinData } from "../BaseSlotGame/WinData";
export interface Symbol {
    Name: string;
    Id: number;
    payout: number;
    canmatch: string[];
    mixedPayout: number;
    defaultPayout: number;
    SpecialType: string;
    isSpecial: boolean;
    reelInstance: { [key: string]: number };
    isSpecialCrz: boolean;
}

export interface CRZSETTINGS {
    id: string;
    isSpecial: boolean;
    matrix: { x: number, y: number };
    currentGamedata: GameData;
    resultSymbolMatrix: any[];
    _winData: WinData | undefined;
    canmatch: string[];
    mixedPayout: number;
    defaultPayout: number;
    SpecialType: string[];
    currentBet: number;
    currentLines: number;
    BetPerLines: number;
    bets: number[];
    reels: any[][];
    Symbols: Symbol[];
    freeSpinCount: number;
    isFreeSpin: boolean;
}

export enum WINNINGTYPE {
    REGULAR = 'regular',
    MIXED = 'mixed',
    DEFAULT = 'default'
}

export enum EXTRASYMBOL {
    MULTIPLY = 'MULTIPLY',
    ADD = 'ADD',
    RESPIN = 'RESPIN'
}