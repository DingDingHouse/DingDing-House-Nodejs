import { GameData } from "../BaseSlotGame/gameType";
import { WinData } from "../BaseSlotGame/WinData";

interface Symbol {
  Name: string;
  Id: number;
  payout: number;
  reelInstance: { [key: string]: number };
}
export type WheelType = "SMALL" | "MEDIUM" | "LARGE" | "NONE";
export type FeatureType = "LEVELUP" | "MULTIPLIER" | "FREESPIN" | "WILD" | "NONE";
export type WheelFeature = {
  isTriggered: boolean,
  wheelType: WheelType;
  featureType: FeatureType;
  featureValue: number;
}
// export type CardSuits = "Hearts" | "Diamonds" | "Spades" | "Clubs";
export interface SLAOGSETTINGS {
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
  isFreeSpin: boolean;
  wheelProb: number[];
  goldSymbolProb: number[];
  goldIndices: [number, number][]
  levelUpResponse: boolean[],
  smallWheelFeature: {
    featureValues: number[],
    featureProbs: number[]
  },
  mediumWheelFeature: {
    featureValues: number[],
    featureProbs: number[]
  },
  largeWheelFeature: {
    featureValues: number[],
    featureProbs: number[]
  },
  wheelFeature: WheelFeature;
  freeSpinCount: number;
  wild: {
    SymbolName: string;
    SymbolID: number;
    useWild: boolean
  },
}


export enum specialIcons {
  wild = "Wild",
  expand = "Expand"
}