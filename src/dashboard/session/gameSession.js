"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameSession = void 0;
const uuid_1 = require("uuid");
const events_1 = require("events");
class GameSession extends events_1.EventEmitter {
    constructor(playerId, gameId, creditsAtEntry) {
        super();
        this.exitTime = null;
        this.creditsAtExit = 0;
        this.totalSpins = 0;
        this.totalBetAmount = 0;
        this.totalWinAmount = 0;
        this.spinData = [];
        this.sessionDuration = 0;
        this.playerId = playerId;
        this.gameId = gameId;
        this.sessionId = this.generateSessionId();
        this.entryTime = new Date();
        this.creditsAtEntry = creditsAtEntry;
    }
    generateSessionId() {
        return `${this.playerId}-${this.gameId}-${Date.now()}`;
    }
    createSpin() {
        const spinId = `${this.gameId}-${Date.now()}-${(0, uuid_1.v4)()}`;
        const newSpin = { spinId, betAmount: 0, winAmount: 0 };
        this.spinData.push(newSpin);
        this.totalSpins++;
        this.emit("spinCreated", newSpin);
        return spinId;
    }
    updateSpinField(spinId, field, value) {
        const spin = this.getSpinById(spinId);
        if (spin) {
            spin[field] = value;
            if (field === "betAmount")
                this.totalBetAmount += value;
            if (field === "winAmount")
                this.totalWinAmount += value;
            this.emit("spinUpdated", this.getSummary());
            return true;
        }
        return false;
    }
    endSession(creditsAtExit) {
        this.exitTime = new Date();
        this.creditsAtExit = creditsAtExit;
        this.sessionDuration = (this.exitTime.getTime() - this.entryTime.getTime()) / 1000;
        this.emit("sessionEnded", this.getSummary());
    }
    getSummary() {
        return {
            playerId: this.playerId,
            gameId: this.gameId,
            sessionId: this.sessionId,
            entryTime: this.entryTime,
            exitTime: this.exitTime,
            creditsAtEntry: this.creditsAtEntry,
            creditsAtExit: this.creditsAtExit,
            totalSpins: this.totalSpins,
            totalBetAmount: this.totalBetAmount,
            totalWinAmount: this.totalWinAmount,
            spinData: this.spinData,
            sessionDuration: this.sessionDuration,
        };
    }
    getSpinById(spinId) {
        return this.spinData.find((spin) => spin.spinId === spinId);
    }
}
exports.GameSession = GameSession;
