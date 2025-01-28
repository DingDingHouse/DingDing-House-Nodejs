import { gambleCardGame } from "../BaseSlotGame/newGambleGame";

export interface SymbolType {
  Name: string;
  Id: number;
  useWildSub: boolean;
  reelInstance: { [key: string]: number };
  multiplier: [number, number][];
  isFreeSpinMultiplier:boolean
}

export type GameResult = number[][];

export interface WinningCombination {
  symbolId: number;
  positions: [number, number][];
  payout: number;
}

export interface SLLOLSETTINGS {
  id: string;
  isSpecial: boolean;
  matrix: { x: number, y: number };
  isEnabled: boolean;
  bets: number[];
  Symbols: SymbolType[];
  resultSymbolMatrix: number[][];
  currentGamedata: any;
  _winData: any;
  currentBet: number;
  currentLines: number;
  BetPerLines: number;
  reels: number[][];
  defaultPayout: number;
  minMatchCount: number;
  isFreeSpin: boolean;
  isFreeSpinTriggered:boolean;
  freeSpinCount: number;
  freeSpinSymbolId: number;
  freeSpinMultipliers: number[];
  freeSpinIncrement: number;
  maxMultiplier: number;
  gamble: {
    type: string;
    isEnabled: boolean;
  },
  winningCombinations: WinningCombination[]
}

export interface FreeSpinResponse {
  freeSpinCount: number[];
  freeSpinMultipliers: number[][];
  combinations: WinningCombination[][]
  results: number [][][]
  isRetriggered : boolean[]
  payouts: number[]
}
