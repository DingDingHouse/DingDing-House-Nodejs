"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gameSession_1 = require("./gameSession");
const utils_1 = require("../../utils/utils");
const socket_1 = require("../../socket");
class PlatformSession {
    constructor(playerId, status, entryTime, managerName, initialCredits) {
        this.exitTime = null;
        this.rtp = 0;
        this.currentGameSession = null;
        this.playerId = playerId;
        this.status = status;
        this.managerName = managerName;
        this.initialCredits = initialCredits;
        this.currentCredits = initialCredits;
        this.entryTime = entryTime;
    }
    startNewGameSession(gameId, creditsAtEntry) {
        const gameSession = new gameSession_1.GameSession(this.playerId, gameId, creditsAtEntry);
        this.currentGameSession = gameSession;
        // Listen to events from GameSession and emit higher-level events
        gameSession.on("spinUpdated", (summary) => {
            const currentManager = socket_1.currentActiveManagers.get(this.managerName);
            if (currentManager) {
                currentManager.notifyManager({ type: utils_1.eventType.UPDATED_SPIN, payload: summary });
            }
        });
        gameSession.on("sessionEnded", (summary) => {
            const currentManager = socket_1.currentActiveManagers.get(this.managerName);
            if (currentManager) {
                currentManager.notifyManager({ type: utils_1.eventType.EXITED_GAME, payload: summary });
            }
        });
    }
    updateCredits(newCredits) {
        this.currentCredits = newCredits;
    }
    setExitTime(exitTime) {
        this.exitTime = exitTime;
    }
    getSummary() {
        var _a;
        return {
            playerId: this.playerId,
            status: this.status,
            managerName: this.managerName,
            initialCredits: this.initialCredits,
            currentCredits: this.currentCredits,
            entryTime: this.entryTime,
            exitTime: this.exitTime,
            currentRTP: this.rtp,
            currentGame: ((_a = this.currentGameSession) === null || _a === void 0 ? void 0 : _a.getSummary()) || null,
        };
    }
}
exports.default = PlatformSession;
