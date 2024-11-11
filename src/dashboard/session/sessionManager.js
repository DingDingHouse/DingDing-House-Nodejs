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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionManager = void 0;
const socket_1 = require("../../socket");
const utils_1 = require("../../utils/utils");
const PlatformSession_1 = __importDefault(require("./PlatformSession"));
const sessionModel_1 = require("./sessionModel");
class SessionManager {
    constructor() {
        this.platformSessions = new Map();
    }
    // Start a new platform session when the player connects
    startPlatformSession(playerId, status, managerName, initialCredits) {
        return __awaiter(this, void 0, void 0, function* () {
            const entryTime = new Date();
            const platformSession = new PlatformSession_1.default(playerId, status, entryTime, managerName, initialCredits);
            this.platformSessions.set(playerId, platformSession);
            try {
                const platformSessionData = new sessionModel_1.PlatformSessionModel(platformSession.getSummary());
                yield platformSessionData.save();
                console.log(`Platform session started and saved for player: ${playerId}`);
            }
            catch (error) {
                console.error(`Failed to save platform session for player: ${playerId}`, error);
            }
            const currentManager = socket_1.currentActiveManagers.get(managerName);
            if (currentManager) {
                currentManager.notifyManager({ type: utils_1.eventType.ENTERED_PLATFORM, payload: platformSession.getSummary() });
            }
            console.log(`Platform session started for player: ${playerId}`);
        });
    }
    // End the platform session when the player disconnects
    endPlatformSession(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const platformSession = this.platformSessions.get(playerId);
            if (platformSession) {
                platformSession.setExitTime(new Date());
                this.platformSessions.delete(playerId);
                const currentManager = socket_1.currentActiveManagers.get(platformSession.managerName);
                if (currentManager) {
                    currentManager.notifyManager({ type: utils_1.eventType.EXITED_PLATFORM, payload: platformSession.getSummary() });
                }
                console.log(`Platform session ended for player: ${playerId}`);
                try {
                    yield sessionModel_1.PlatformSessionModel.updateOne({ playerId: playerId, entryTime: platformSession.entryTime }, { $set: { exitTime: platformSession.exitTime } });
                    console.log(`Platform session saved to database for player: ${playerId}`);
                }
                catch (error) {
                    console.error(`Failed to save platform session for player: ${playerId}`, error);
                }
            }
            else {
                console.error(`No active platform session found for player: ${playerId}`);
            }
        });
    }
    // Start a new Game session under the player's paltform session
    startGameSession(playerId, gameId, creditsAtEntry) {
        var _a;
        const platformSession = this.platformSessions.get(playerId);
        if (platformSession) {
            platformSession.startNewGameSession(gameId, creditsAtEntry);
            const gameSummary = (_a = platformSession.currentGameSession) === null || _a === void 0 ? void 0 : _a.getSummary();
            if (gameSummary) {
                const currentManager = socket_1.currentActiveManagers.get(platformSession.managerName);
                if (currentManager) {
                    currentManager.notifyManager({ type: utils_1.eventType.ENTERED_GAME, payload: gameSummary });
                }
                console.log(`Game session started for player: ${playerId}, game: ${gameId}`);
            }
            else {
                console.error(`No active platform session found for player: ${playerId}`);
            }
        }
        else {
            console.error(`No active platform session found for player: ${playerId}`);
        }
    }
    // End the current game session for the player
    endGameSession(playerId, creditsAtExit) {
        return __awaiter(this, void 0, void 0, function* () {
            const platformSession = this.platformSessions.get(playerId);
            if (platformSession) {
                const currentSession = platformSession.currentGameSession;
                if (currentSession) {
                    currentSession.endSession(creditsAtExit);
                    const gameSessionData = currentSession.getSummary();
                    console.log(`Game session ended for player: ${playerId}, game: ${currentSession.gameId}`);
                    try {
                        yield sessionModel_1.PlatformSessionModel.updateOne({ playerId: playerId, entryTime: platformSession.entryTime }, { $push: { gameSessions: gameSessionData }, $set: { currentRTP: platformSession.rtp } });
                        console.log(`Game session saved to platform session for player: ${playerId}`);
                    }
                    catch (error) {
                        console.error(`Failed to save game session for player: ${playerId}`, error);
                    }
                }
            }
            else {
                console.error(`No active platform session or game session found for player: ${playerId}`);
            }
        });
    }
    // Get platform session for a player
    getPlatformSession(playerId) {
        return this.platformSessions.get(playerId);
    }
    getCurrentGameSession(playerId) {
        var _a;
        return (_a = this.platformSessions.get(playerId)) === null || _a === void 0 ? void 0 : _a.currentGameSession;
    }
}
exports.sessionManager = new SessionManager();
