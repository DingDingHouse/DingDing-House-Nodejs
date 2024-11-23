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
exports.sessionManager = void 0;
const utils_1 = require("../../utils/utils");
const gameSession_1 = require("./gameSession");
const sessionModel_1 = require("./sessionModel");
class SessionManager {
    constructor() {
        this.platformSessions = new Map();
        this.currentActiveManagers = new Map();
    }
    startPlatformSession(player) {
        return __awaiter(this, void 0, void 0, function* () {
            this.platformSessions.set(player.playerData.username, player);
            try {
                const platformSessionData = new sessionModel_1.PlatformSessionModel(player.getSummary());
                yield platformSessionData.save();
                const manager = this.getActiveManagerByUsername(player.managerName);
                if (manager) {
                    manager.notifyManager({ type: utils_1.eventType.ENTERED_PLATFORM, payload: player.getSummary() });
                }
            }
            catch (error) {
                console.error(`Failed to save platform session for player: ${player.playerData.username}`, error);
            }
            finally {
                console.log(`PLATFORM STARTED : `, player.playerData.username);
            }
        });
    }
    endPlatformSession(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const platformSession = this.getPlayerPlatform(playerId);
                if (platformSession) {
                    platformSession.setExitTime();
                    this.platformSessions.delete(playerId);
                    const currentManager = this.getActiveManagerByUsername(platformSession.managerName);
                    if (currentManager) {
                        currentManager.notifyManager({ type: utils_1.eventType.EXITED_PLATFORM, payload: platformSession.getSummary() });
                    }
                    yield sessionModel_1.PlatformSessionModel.updateOne({ playerId: playerId, entryTime: platformSession.entryTime }, { $set: { exitTime: platformSession.exitTime } });
                }
            }
            catch (error) {
                console.error(`Failed to save platform session for player: ${playerId}`, error);
            }
        });
    }
    startGameSession(playerId, gameId, credits) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const platformSession = this.getPlayerPlatform(playerId);
            if (platformSession) {
                platformSession.currentGameSession = new gameSession_1.GameSession(playerId, gameId, credits);
                platformSession.currentGameSession.on("spinUpdated", (summary) => {
                    const currentManager = this.getActiveManagerByUsername(platformSession.managerName);
                    if (currentManager) {
                        currentManager.notifyManager({ type: utils_1.eventType.UPDATED_SPIN, payload: summary });
                    }
                });
                platformSession.currentGameSession.on("sessionEnded", (summary) => {
                    const currentManager = this.getActiveManagerByUsername(platformSession.managerName);
                    if (currentManager) {
                        currentManager.notifyManager({ type: utils_1.eventType.EXITED_GAME, payload: summary });
                    }
                });
                const gameSummary = (_a = platformSession.currentGameSession) === null || _a === void 0 ? void 0 : _a.getSummary();
                if (gameSummary) {
                    const currentManager = this.getActiveManagerByUsername(platformSession.managerName);
                    if (currentManager) {
                        currentManager.notifyManager({ type: utils_1.eventType.ENTERED_GAME, payload: gameSummary });
                    }
                }
                else {
                    console.error(`No active platform session found for player: ${playerId}`);
                }
            }
            else {
                console.error(`No active platform session found for player: ${playerId}`);
            }
        });
    }
    endGameSession(playerId, credits) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const platformSession = this.getPlayerPlatform(playerId);
                if (platformSession && platformSession.currentGameSession) {
                    // End and delete the current game session
                    platformSession.currentGameSession.endSession(platformSession.playerData.credits);
                    const gameSessionData = platformSession.currentGameSession.getSummary();
                    yield sessionModel_1.PlatformSessionModel.updateOne({ playerId: playerId, entryTime: platformSession.entryTime }, { $push: { gameSessions: gameSessionData }, $set: { currentRTP: platformSession.currentRTP } });
                    platformSession.currentGameSession = null;
                    console.log(`Current game session deleted for player: ${playerId}`);
                }
            }
            catch (error) {
                console.error(`Failed to delete the current game session for player: ${playerId}`, error);
            }
        });
    }
    getPlatformSessions() {
        return this.platformSessions;
    }
    getPlayerPlatform(username) {
        if (this.platformSessions.has(username)) {
            return this.platformSessions.get(username) || null;
        }
        return null;
    }
    getPlayerCurrentGameSession(username) {
        var _a;
        return (_a = this.getPlayerPlatform(username)) === null || _a === void 0 ? void 0 : _a.currentGameSession;
    }
    addManager(username, manager) {
        if (this.currentActiveManagers.has(username)) {
            console.warn(`Manager with username "${username}" already exists in currentActiveManagers.`);
        }
        else {
            this.currentActiveManagers.set(username, manager);
            console.log(`Manager with username "${username}" has been added to currentActiveManagers.`);
        }
    }
    getActiveManagers() {
        return this.currentActiveManagers;
    }
    getActiveManagerByUsername(username) {
        if (this.currentActiveManagers.has(username)) {
            return this.currentActiveManagers.get(username) || null;
        }
        return null;
    }
    deleteManagerByUsername(username) {
        if (this.currentActiveManagers.has(username)) {
            this.currentActiveManagers.delete(username);
            console.log(`Manager with username "${username}" has been removed from currentActiveManagers.`);
        }
        else {
            console.warn(`Manager with username "${username}" not found in currentActiveManagers.`);
        }
    }
}
exports.sessionManager = new SessionManager();
