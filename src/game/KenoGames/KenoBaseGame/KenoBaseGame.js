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
const sessionManager_1 = require("../../../dashboard/session/sessionManager");
const utils_1 = require("../../../utils/utils");
const helper_1 = require("./helper");
class KenoBaseGame {
    constructor(currentGameData) {
        this.currentGameData = currentGameData;
        this.playerData = {
            haveWon: 0,
            currentWining: 0,
            totalbet: 0,
            rtpSpinCount: 0,
            totalSpin: 0,
            currentPayout: 0,
        };
        this.settings = (0, helper_1.initializeGameSettings)(currentGameData, this);
        (0, helper_1.sendInitData)(this);
    }
    sendMessage(action, message) {
        this.currentGameData.sendMessage(action, message, true);
    }
    sendError(message) {
        this.currentGameData.sendError(message, true);
    }
    sendAlert(message) {
        this.currentGameData.sendAlert(message, true);
    }
    updatePlayerBalance(message) {
        this.currentGameData.updatePlayerBalance(message);
    }
    deductPlayerBalance(message) {
        this.currentGameData.deductPlayerBalance(message);
    }
    getPlayerData() {
        return this.currentGameData.getPlayerData();
    }
    prepareSpin(data) {
        this.settings.currentBet = this.settings.bets[data.currentBet];
        this.settings.picks = data.picks;
    }
    messageHandler(response) {
        switch (response.id) {
            case "SPIN":
                this.prepareSpin(response.data);
                this.settings.forRTP = false;
                this.spinResult();
                break;
            case "GENRTP":
                this.settings.forRTP = true;
                this.prepareSpin(response.data);
                this.getRTP(response.data.spins || 1);
                break;
            default:
                console.warn(`Unhandled message ID: ${response.id}`);
                this.sendError(`Unhandled message ID: ${response.id}`);
                break;
        }
    }
    getRTP(spins) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = [];
            //Need to generate rtp for all number of picks 
            for (let i = 1; i <= this.settings.maximumPicks; i++) {
                let totalWin = 0;
                let totalBet = 0;
                for (let j = 0; j < spins; j++) {
                    this.settings.picks = (0, helper_1.getNNumbers)(this.settings.total, i);
                    yield this.spinResult();
                    totalWin = (0, utils_1.precisionRound)(totalWin + this.playerData.currentWining, 5);
                    totalBet = (0, utils_1.precisionRound)(totalBet + this.settings.currentBet, 5);
                }
                response.push(`RTP for ${i} picks is ${(0, utils_1.precisionRound)((totalWin / totalBet) * 100, 5)}%`);
            }
            response.forEach((res) => {
                console.log(res);
            });
        });
    }
    spinResult() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const playerData = this.getPlayerData();
                const platformSession = sessionManager_1.sessionManager.getPlayerPlatform(playerData.username);
                if (this.settings.currentBet > playerData.credits) {
                    this.sendError("Low Balance");
                    return;
                }
                const { currentBet } = this.settings;
                this.deductPlayerBalance(currentBet);
                this.playerData.totalbet = (0, utils_1.precisionRound)(this.playerData.totalbet + currentBet, 5);
                const spinId = platformSession.currentGameSession.createSpin();
                platformSession.currentGameSession.updateSpinField(spinId, 'betAmount', this.settings.currentBet);
                (0, helper_1.checkForWin)(this);
                const winAmount = this.playerData.currentWining;
                platformSession.currentGameSession.updateSpinField(spinId, 'winAmount', winAmount);
            }
            catch (error) {
                this.sendError("Spin error");
                console.error("Failed to generate spin results:", error);
            }
        });
    }
}
exports.default = KenoBaseGame;
