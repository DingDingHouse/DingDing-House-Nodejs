"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UiInitData = exports.betMultiplier = exports.ResultType = exports.gameCategory = exports.getCurrentRTP = exports.PlayerData = exports.bonusGameType = exports.specialIcons = void 0;
exports.convertSymbols = convertSymbols;
exports.shuffleArray = shuffleArray;
exports.getPlayerCredits = getPlayerCredits;
const userModel_1 = require("../../dashboard/users/userModel");
var specialIcons;
(function (specialIcons) {
    specialIcons["bonus"] = "Bonus";
    specialIcons["scatter"] = "Scatter";
    specialIcons["jackpot"] = "Jackpot";
    specialIcons["wild"] = "Wild";
    specialIcons["any"] = "any";
    specialIcons["FreeSpin"] = "FreeSpin";
})(specialIcons || (exports.specialIcons = specialIcons = {}));
var bonusGameType;
(function (bonusGameType) {
    bonusGameType["tap"] = "tap";
    bonusGameType["spin"] = "spin";
    bonusGameType["default"] = "default";
    bonusGameType["miniSpin"] = "miniSpin";
    bonusGameType["layerTap"] = "layerTap";
})(bonusGameType || (exports.bonusGameType = bonusGameType = {}));
exports.PlayerData = {
    Balance: 0,
    haveWon: 0,
    currentWining: 0
};
exports.getCurrentRTP = {
    playerWon: 0,
    playerTotalBets: 0,
};
var gameCategory;
(function (gameCategory) {
    gameCategory["SLOT"] = "SL";
    gameCategory["KENO"] = "KN";
})(gameCategory || (exports.gameCategory = gameCategory = {}));
var ResultType;
(function (ResultType) {
    ResultType["moolah"] = "moolah";
    ResultType["normal"] = "normal";
})(ResultType || (exports.ResultType = ResultType = {}));
exports.betMultiplier = [0.1, 0.25, 0.5, 0.75, 1];
exports.UiInitData = {
    paylines: null,
    spclSymbolTxt: [],
    AbtLogo: {
        logoSprite: "https://iili.io/JrMCqPf.png",
        link: "https://dingding-game.vercel.app/login",
    },
    ToULink: "https://dingding-game.vercel.app/login",
    PopLink: "https://dingding-game.vercel.app/login",
};
function convertSymbols(data) {
    let uiData = {
        symbols: [],
    };
    if (!Array.isArray(data)) {
        // console.error("Input data is not an array");
        return uiData;
    }
    data.forEach((element) => {
        let symbolData = {
            ID: element.Id,
            Name: element.Name || {},
            "multiplier": element.multiplier || {},
            "defaultAmount": element.defaultAmount || {},
            "symbolsCount": element.symbolsCount || {},
            "increaseValue": element.increaseValue || {},
            "freeSpin": element.freeSpin,
            "description": element.description || {},
            "payout": element.payout || 0,
            "mixedPayout": element.mixedPayout || {},
            "defaultPayout": element.defaultPayout || {}
        };
        // if (element.multiplier) {
        //   const multiplierObject = {};
        //   element.multiplier.forEach((item, index) => {
        //     multiplierObject[(5 - index).toString() + "x"] = item[0];
        //   });
        //   symbolData.multiplier = multiplierObject;
        // }
        uiData.symbols.push(symbolData);
    });
    return uiData;
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let k = array[i];
        array[i] = array[j];
        array[j] = k;
    }
}
function getPlayerCredits(playerName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const currentUser = yield userModel_1.Player.findOne({ username: playerName }).exec();
            if (!currentUser) {
                return `No user found with playerName ${playerName}`;
            }
            return currentUser.credits;
        }
        catch (error) {
            console.error(`Error fetching credits for player ${playerName}:`, error);
            return `An error occurred while fetching credits for player ${playerName}.`;
        }
    });
}
