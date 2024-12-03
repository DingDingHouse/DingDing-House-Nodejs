import { GameData } from "../BaseSlotGame/gameType";
import { WinData } from "../BaseSlotGame/WinData";

interface Symbol {
    Name: string;
    Id: number;
    payout: number;
    reelInstance: { [key: string]: number };
}

export interface FrozenIndex {
    position: [number, number];
    prizeValue?:number;
    value: number;
    symbol:number|string;
  }

 
export interface bonusSymbol {
    position: [number, number];
    prizeValue:number;
    symbol:number|string;

  } 

//  export interface mysterySymbol {
//     position: [number, number];
//     prizeValue?:number;
//     symbol: number;
//  } 
export interface SLSMSETTINGS {
    id: string;
    matrix: { x: number, y: number };
    currentGamedata: GameData;
    resultSymbolMatrix: any[];
    tempResultSymbolMatrix:any[];
    bonusResultMatrix:any[];
    lineData: any[],
    _winData: WinData | undefined;
    currentBet: number;
    baseBetAmount:number;
    currentLines: number;
    BetPerLines: number;
    bets: number[];
    reels: any[][];
    bonusReels: any[][];
    Symbols: Symbol[];
    BonusSymbols: Symbol[];
    stickySymbolCount: number [],
    stickySymbolCountProb :number [],
    prizeValue:number [],
    prizeValueProb: number [], 
    mysteryValues: number [],
    mysteryValueProb :number [],
    moonMysteryValues:number [],
    moonMysteryValueProb: number [], 
    bonusSymbolValue: bonusSymbol[],
    frozenIndices:bonusSymbol[],
    miniMultiplier:number,
    minorMultiplier:number,
    majorMultiplier:number,
    grandMultiplier:number,
    moonMultiplier:number,
    moonMysteryData:bonusSymbol[],
    isMoonJackpot:boolean,
    isStickyBonusSymbol:boolean,
    isGrandPrize:boolean,
    isStickyBonus:boolean,
    freeSpin: {
        freeSpinCount: number,
        freeSpinAwarded: number,
        useFreeSpin: boolean,
        freeSpinsAdded: boolean,
        freeSpinPayout:number
    };
    wild: {
        SymbolName: string;
        SymbolID: number;
        useWild: boolean
    },
    bonus:{
        SymbolName: string;
        SymbolID: number;
        useWild: boolean
    },
    coins:{
        SymbolName: string;
        SymbolID: number;
        useWild: boolean
    },
    arthurBonus:{
        SymbolName: string;
        SymbolID: number;
        useWild: boolean
    },
    tomBonus:{
        SymbolName: string;
        SymbolID: number;
        useWild: boolean
    },
    pollyBonus:{
        SymbolName: string;
        SymbolID: number;
        useWild: boolean
    },
    mini:{
        SymbolName: string;
        SymbolID: number;
        useWild: boolean
    },
    major:{    
        SymbolName: string;
        SymbolID: number;
        useWild: boolean
    },
    mega:{    
        SymbolName: string;
        SymbolID: number;
        useWild: boolean
    },
    thomas:{    
        SymbolName: string;
        SymbolID: number;
        useWild: boolean
    }
}


export enum specialIcons {
    wild = "Wild",
    bonus = "Bonus",
    coins = "Coins",
    mini = "Mini",
    major = "Major",
    mega = "Mega",
    arthurBonus = "ArthurBonus",
    tomBonus = "TomBonus",
    pollyBonus =  "PollyBonus",
    thomas = "Thomas"
}