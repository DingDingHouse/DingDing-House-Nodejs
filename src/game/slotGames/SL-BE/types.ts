import { GameData } from "../BaseSlotGame/gameType";
import { WinData } from "../BaseSlotGame/WinData";

interface Symbol {
  Name: string;
  Id: number;
  payout: number;
  reelInstance: { [key: string]: number };
}
export interface SLBESETTINGS {
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
  isLeftWinTrue: boolean;
  bats:{
    isEnabled: boolean,
    batCount: number,
    positions:string[],
    multipliers: number[],
    payout: number
  },
  freeSpin: {
    symbolID: string,
    isEnabled: boolean,
    countIncrement: number,
    isFreeSpin: boolean,
    isTriggered: boolean,
    freeSpinCount: number,
    bloodSplash:{
      countProb:number[],
    },
    newVampHumanPositions: [string,string][],
    substitutions: {
      vampHuman: [string, string][]
      bloodSplash: {
        index: string,
        symbolId: string
      }[]
    }
  };
  gamble: {
    isEnabled: boolean,
  }
  wild: {
    SymbolName: string;
    SymbolID: number;
    multiplier: number[]
  },
  vampireMan: {
    SymbolName: string;
    SymbolID: number;
    useWild: boolean
  },
  vampireWoman: {
    SymbolName: string;
    SymbolID: number;
    useWild: boolean
  },
  HumanMan: {
    SymbolName: string;
    SymbolID: number;
    useWild: boolean
  },
  HumanWoman: {
    SymbolName: string;
    SymbolID: number;
    useWild: boolean
  },
  Bat:{
    SymbolName: string;
    SymbolID: number;
    useWild: boolean
  },
  BatX2:{
    SymbolName: string;
    SymbolID: number;
    useWild: boolean
  }
}


export enum specialIcons {
  wild = "Wild",
  FreeSpin = "FreeSpin",
  VampireMan = "VampireMan",
  VampireWoman = "VampireWoman",
  HumanMan = "HumanMan",
  HumanWoman = "HumanWoman",
  Bat = "Bat",
  BatX2 = "BatX2"
}