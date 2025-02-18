
export interface SymbolType {
  Name: string;
  Id: number;
  useWildSub: boolean;
  reelInstance: { [key: string]: number };
  multiplier: [number, number][];
}

export type GameResult = number[][];

export interface WinningCombination {
  symbolId: number;
  positions: [number, number][];
  payout: number;
}

export interface SLLLLSETTINGS {
  id: string;
  isSpecial: boolean;
  matrix: { x: number, y: number };
  isEnabled: boolean;
  bets: number[];
  Symbols: SymbolType[];
  resultSymbolMatrix: number[][];
  currentGamedata: any;
  lineData: any[],
  _winData: any;
  currentBet: number;
  currentLines: number;
  BetPerLines: number;
  reels: number[][];
  defaultPayout: number;
  minMatchCount: number;
  maxMultiplier: number;
  scatter: {
    SymbolName: string;
    SymbolID: number;
    useWild: boolean
  },

  doubleLines: {
    index: number,
    payout: number
  }[],
  // isDouble:boolean,
  freeSpin: {
    SymbolName: string;
    SymbolID: number;
    useWild: boolean
    isFreeSpin: boolean;
    isFreeSpinTriggered: boolean;
    freeSpinCount: number;
    freeSpinMultiplier: number;
    freeSpinIncrement: number;
    diamondCount: number;
    diamondMultipliers: { range: [number, number], multiplier: number }[];
    payout: number
  },
}

export interface FreeSpinResponse {
  freeSpinCount: number[];
  freeSpinMultipliers: number[][];
  combinations: WinningCombination[][]
  results: number[][][]
  isRetriggered: boolean[]
  payouts: number[]
}

export enum specialIcons {
  scatter = "Scatter",
  freeSpin = "FreeSpin"
}