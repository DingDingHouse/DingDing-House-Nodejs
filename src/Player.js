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
const mongoose_1 = __importDefault(require("mongoose"));
const userModel_1 = require("./dashboard/users/userModel");
const gameModel_1 = require("./dashboard/games/gameModel");
const payoutController_1 = __importDefault(require("./dashboard/payouts/payoutController"));
const gameUtils_1 = require("./game/Utils/gameUtils");
const testData_1 = require("./game/testData");
const socket_1 = require("./socket");
const GameManager_1 = __importDefault(require("./game/GameManager"));
const http_errors_1 = __importDefault(require("http-errors"));
const utils_1 = require("./utils/utils");
const sessionManager_1 = require("./dashboard/session/sessionManager");
class PlayerSocket {
    constructor(username, role, status, credits, userAgent, socket) {
        if (socket_1.currentActivePlayers.has(username)) {
            const existingPlayerSocket = socket_1.currentActivePlayers.get(username);
            if (existingPlayerSocket.platformData.socket.id !== socket.id) {
                console.log(`User ${username} reconnected with a new socket ID.`);
                existingPlayerSocket.initializePlatformSocket(socket);
                return;
            }
        }
        this.platformData = {
            socket: socket,
            heartbeatInterval: setInterval(() => { }, 0),
            reconnectionAttempts: 0,
            maxReconnectionAttempts: 3,
            reconnectionTimeout: 1000,
            cleanedUp: false
        };
        this.gameData = {
            socket: null,
            heartbeatInterval: setInterval(() => { }, 0),
            reconnectionAttempts: 0,
            maxReconnectionAttempts: 3,
            reconnectionTimeout: 1000,
            cleanedUp: false,
        };
        this.playerData = {
            username,
            role,
            credits,
            userAgent,
            status
        };
        this.currentGameData = {
            gameId: null,
            username: this.playerData.username,
            gameSettings: null,
            currentGameManager: null,
            session: null,
            sendMessage: this.sendMessage.bind(this),
            sendError: this.sendError.bind(this),
            sendAlert: this.sendAlert.bind(this),
            updatePlayerBalance: this.updatePlayerBalance.bind(this),
            deductPlayerBalance: this.deductPlayerBalance.bind(this),
            getPlayerData: () => this.playerData,
        };
        this.initializePlatformSocket(socket);
        // Add to the users map if it's a new user
        if (!socket_1.currentActivePlayers.has(username)) {
            socket_1.currentActivePlayers.set(username, this);
        }
    }
    initializePlatformSocket(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            if (socket) {
                console.log(`Initializing platform connection for user ${this.playerData.username}`);
                if (this.gameData.socket) {
                    console.log("Cleaning up existing game session before platform re-initialization.");
                    yield this.cleanupGameSocket();
                }
                this.platformData.socket = socket;
                this.messageHandler(false);
                this.startPlatformHeartbeat();
                this.onExit();
                this.managerName = yield this.getManager(this.playerData.username);
                if (!this.managerName) {
                    throw new Error(`Manager name not found for player ${this.playerData.username}`);
                }
                yield sessionManager_1.sessionManager.startPlatformSession(this.playerData.username, this.playerData.status, this.managerName, this.playerData.credits);
                if (this.platformData.socket) {
                    this.platformData.socket.on("disconnect", () => {
                        console.log(`Platform connection lost for user ${this.playerData.username}`);
                        this.handlePlatformDisconnection();
                    });
                }
                else {
                    console.error("Socket is null during initialization of disconnect event");
                }
                this.sendData({ type: "CREDIT", data: { credits: this.playerData.credits } }, "platform");
            }
        });
    }
    initializeGameSocket(socket) {
        if (this.gameData.socket) {
            this.cleanupGameSocket();
        }
        this.gameData.socket = socket;
        this.currentGameData.gameId = socket.handshake.auth.gameId;
        sessionManager_1.sessionManager.startGameSession(this.playerData.username, this.currentGameData.gameId, this.playerData.credits);
        this.gameData.socket.on("disconnect", () => this.handleGameDisconnection());
        this.initGameData();
        this.startGameHeartbeat();
        this.onExit(true);
        this.messageHandler(true);
        this.gameData.socket.emit("socketState", true);
    }
    // Handle platform disconnection and reconnection
    handlePlatformDisconnection() {
        this.attemptReconnection(this.platformData);
    }
    // Handle game disconnection and reconnection
    handleGameDisconnection() {
        this.attemptReconnection(this.gameData);
    }
    // Cleanup only the game socket
    cleanupGameSocket() {
        return __awaiter(this, void 0, void 0, function* () {
            yield sessionManager_1.sessionManager.endGameSession(this.playerData.username, this.playerData.credits);
            if (this.gameData.socket) {
                this.gameData.socket.disconnect(true);
                this.gameData.socket = null;
            }
            clearInterval(this.gameData.heartbeatInterval);
            this.currentGameData.currentGameManager = null;
            this.currentGameData.gameSettings = null;
            this.currentGameData.gameId = null;
            this.gameData.reconnectionAttempts = 0;
        });
    }
    // Cleanup only the platform socket
    cleanupPlatformSocket() {
        return __awaiter(this, void 0, void 0, function* () {
            yield sessionManager_1.sessionManager.endPlatformSession(this.playerData.username);
            if (this.platformData.socket) {
                this.platformData.socket.disconnect(true);
                this.platformData.socket = null;
            }
            clearInterval(this.platformData.heartbeatInterval);
            this.platformData.reconnectionAttempts = 0;
            this.platformData.cleanedUp = true;
            // Only remove the user from the map if the socket is still the same
            // This ensures that if the user has already reconnected with a new socket, they are not removed.
            const currentPlayerSocket = socket_1.currentActivePlayers.get(this.playerData.username);
            if (currentPlayerSocket && currentPlayerSocket.platformData.socket === null) {
                socket_1.currentActivePlayers.delete(this.playerData.username);
            }
        });
    }
    // Attempt reconnection  for platform or game socket based on provided data
    attemptReconnection(socketData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                while (socketData.reconnectionAttempts < socketData.maxReconnectionAttempts) {
                    console.log(`Reconnecting: ${socketData.reconnectionAttempts}...`);
                    // If the user has already reconnected with a new socket, stop reconnection attempts
                    if (socketData.socket && socketData.socket.connected) {
                        console.log("Reconnection successful");
                        socketData.reconnectionAttempts = 0; // Reset reconnection attempts
                        return;
                    }
                    yield new Promise((resolve) => setTimeout(resolve, socketData.reconnectionTimeout));
                    socketData.reconnectionAttempts++;
                    if (socketData.cleanedUp)
                        return;
                }
                if (socketData === this.platformData) {
                    yield this.cleanupPlatformSocket();
                }
                else {
                    yield this.cleanupGameSocket();
                }
            }
            catch (error) {
                console.error("Reconnection attempt failed:", error);
            }
        });
    }
    // Start heartbeat for platform socket
    startPlatformHeartbeat() {
        if (this.platformData.socket) {
            this.platformData.heartbeatInterval = setInterval(() => {
                if (this.gameData.socket) {
                    this.sendAlert(`Currenlty Playing : ${this.currentGameData.gameId}`);
                }
                this.sendData({ type: "CREDIT", data: { credits: this.playerData.credits } }, "platform");
            }, 10000);
        }
    }
    // Start heartbeat for game socket
    startGameHeartbeat() {
        if (this.gameData.socket) {
            this.gameData.heartbeatInterval = setInterval(() => {
                if (this.gameData.socket && this.currentGameData.gameId) {
                    this.sendAlert(`${this.playerData.username} : ${this.currentGameData.gameId}`);
                }
            }, 20000);
        }
    }
    updateGameSocket(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.platformData.socket || !this.platformData.socket.connected) {
                console.log("Game connection blocked - platform connection missing.");
                socket.emit("internalError" /* messageType.ERROR */, "Platform connection required.");
                socket.disconnect(true);
                throw (0, http_errors_1.default)(403, "Platform connection required before joining a game.");
            }
            // Check for user agent to prevent multiple devices
            if (socket.request.headers["user-agent"] !== this.playerData.userAgent) {
                socket.emit("alert", {
                    id: "AnotherDevice",
                    message: "You are already playing on another browser",
                });
                socket.disconnect(true);
                throw (0, http_errors_1.default)(403, "You are already playing on another browser");
            }
            // Delay-based retry to ensure platform stability
            yield new Promise(resolve => setTimeout(resolve, 500));
            console.log("Initializing game socket connection after platform stability confirmed.");
            this.initializeGameSocket(socket);
            const credits = yield (0, gameUtils_1.getPlayerCredits)(this.playerData.username);
            this.playerData.credits = typeof credits === "number" ? credits : 0;
        });
    }
    initGameData() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.gameData.socket)
                return;
            try {
                const tagName = this.currentGameData.gameId;
                const platform = yield gameModel_1.Platform.aggregate([
                    { $unwind: "$games" },
                    { $match: { "games.tagName": tagName, "games.status": "active" } },
                    { $project: { _id: 0, game: "$games" } },
                ]);
                if (platform.length === 0) {
                    this.currentGameData.gameSettings = Object.assign({}, testData_1.gameData[0]);
                    this.currentGameData.currentGameManager = new GameManager_1.default(this.currentGameData);
                    return;
                }
                const game = platform[0].game;
                const payout = yield payoutController_1.default.getPayoutVersionData(game.tagName, game.payout);
                if (!payout) {
                    this.currentGameData.gameSettings = Object.assign({}, testData_1.gameData[0]);
                    this.currentGameData.currentGameManager = new GameManager_1.default(this.currentGameData);
                    return;
                }
                this.currentGameData.gameSettings = Object.assign({}, payout);
                this.currentGameData.currentGameManager = new GameManager_1.default(this.currentGameData);
            }
            catch (error) {
                console.error(`Error initializing game data for user ${this.playerData.username}:`, error);
            }
        });
    }
    sendMessage(action, message, isGameSocket = false) {
        const socket = isGameSocket ? this.gameData.socket : this.platformData.socket;
        if (socket) {
            socket.emit("message" /* messageType.MESSAGE */, JSON.stringify({ id: action, message, username: this.playerData.username }));
        }
    }
    sendData(data, type) {
        try {
            const socket = type === "platform" ? this.platformData.socket : this.gameData.socket;
            if (socket) {
                socket.emit("data" /* messageType.DATA */, data);
            }
        }
        catch (error) {
            console.error(`Error sending data to ${this.playerData.username}'s platform`);
            console.error(error);
        }
    }
    // Send an error message to the client (either platform or game)
    sendError(message, isGameSocket = false) {
        const socket = isGameSocket ? this.gameData.socket : this.platformData.socket;
        if (socket) {
            socket.emit("internalError" /* messageType.ERROR */, message);
        }
    }
    // Send an alert to the client (platform or game)
    sendAlert(message, isGameSocket = false) {
        const socket = isGameSocket ? this.gameData.socket : this.platformData.socket;
        if (socket) {
            socket.emit("alert" /* messageType.ALERT */, message);
        }
    }
    // Handle client message communication for the game socket
    messageHandler(isGameSocket = false) {
        const socket = isGameSocket ? this.gameData.socket : this.platformData.socket;
        if (socket) {
            socket.on("message", (message) => {
                try {
                    const response = JSON.parse(message);
                    if (isGameSocket) {
                        // Delegate message to the current game manager's handler for game-specific logic
                        this.currentGameData.currentGameManager.currentGameType.currentGame.messageHandler(response);
                    }
                    else {
                        // Handle platform-specific messages here if needed
                        console.log(`Platform message received: ${response}`);
                    }
                }
                catch (error) {
                    console.error("Failed to parse message:", error);
                    this.sendError("Failed to parse message", isGameSocket);
                }
            });
        }
    }
    // Handle user exit event for the game or platform
    onExit(isGameSocket = false) {
        const socket = isGameSocket ? this.gameData.socket : this.platformData.socket;
        if (socket) {
            socket.on("EXIT", () => __awaiter(this, void 0, void 0, function* () {
                if (isGameSocket) {
                    this.sendMessage('ExitUser', '', true); // Notify game exit
                    yield this.cleanupGameSocket(); // Clean up game socket
                }
                else {
                    yield this.cleanupPlatformSocket(); // Clean up platform socket
                    socket_1.currentActivePlayers.delete(this.playerData.username);
                }
            }));
        }
    }
    forceExit() {
        return __awaiter(this, arguments, void 0, function* (isGameSocket = false) {
            // Send a forced exit alert to the correct socket (game or platform)
            this.sendAlert("ForcedExit", isGameSocket);
            // If the user is exiting the game, only clean up the game socket
            if (isGameSocket) {
                yield this.cleanupGameSocket(); // Clean up the game socket only
            }
            else {
                // If the user is exiting the platform, clean up both platform and game sockets and remove from the users map
                yield this.cleanupPlatformSocket(); // Clean up the platform socket
                yield this.cleanupGameSocket(); // Optionally, also clean up the game socket if needed
                socket_1.currentActivePlayers.delete(this.playerData.username); // Remove from active users map (platform exit)
            }
        });
    }
    updateDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            try {
                session.startTransaction();
                const finalBalance = this.playerData.credits;
                yield userModel_1.Player.findOneAndUpdate({ username: this.playerData.username }, { credits: finalBalance.toFixed(2) }, { new: true, session });
                yield session.commitTransaction();
            }
            catch (error) {
                yield session.abortTransaction();
                // console.error("Failed to update database:", error);
                this.sendError("Database error");
            }
            finally {
                session.endSession();
            }
        });
    }
    checkPlayerBalance(bet) {
        if (this.playerData.credits < bet) {
            this.sendMessage("low-balance", true);
            console.error("LOW BALANCE");
        }
    }
    updatePlayerBalance(credit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.playerData.credits += credit;
                yield this.updateDatabase();
            }
            catch (error) {
                console.error("Error updating credits in database:", error);
            }
        });
    }
    deductPlayerBalance(currentBet) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkPlayerBalance(currentBet);
            this.playerData.credits -= currentBet;
        });
    }
    getManager(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const managerName = yield (0, utils_1.getManagerName)(username);
            return managerName;
        });
    }
}
exports.default = PlayerSocket;