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
exports.currentActiveManagers = exports.currentActivePlayers = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = require("./dashboard/users/userModel");
const config_1 = require("./config/config");
const Player_1 = __importDefault(require("./Player"));
const http_errors_1 = __importDefault(require("http-errors"));
const Manager_1 = __importDefault(require("./Manager"));
const sessionManager_1 = require("./dashboard/session/sessionManager");
exports.currentActivePlayers = new Map();
exports.currentActiveManagers = new Map();
const verifySocketToken = (socket) => {
    return new Promise((resolve, reject) => {
        const token = socket.handshake.auth.token;
        if (token) {
            jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret, (err, decoded) => {
                if (err) {
                    console.error("Token verification failed:", err.message);
                    reject(new Error("You are not authenticated"));
                }
                else if (!decoded || !decoded.username) {
                    reject(new Error("Token does not contain required fields"));
                }
                else {
                    resolve(decoded);
                }
            });
        }
        else {
            reject(new Error("No authentication token provided"));
        }
    });
};
const getPlayerDetails = (username) => __awaiter(void 0, void 0, void 0, function* () {
    const player = yield userModel_1.Player.findOne({ username });
    if (player) {
        return { credits: player.credits, status: player.status };
    }
    throw new Error("Player not found");
});
const getManagerDetails = (username) => __awaiter(void 0, void 0, void 0, function* () {
    const manager = yield userModel_1.User.findOne({ username });
    if (manager) {
        return { credits: manager.credits, status: manager.status };
    }
    throw new Error("Manager not found");
});
const handlePlayerConnection = (socket, decoded, userAgent) => __awaiter(void 0, void 0, void 0, function* () {
    const username = decoded.username;
    const origin = socket.handshake.auth.origin;
    const gameId = socket.handshake.auth.gameId;
    const { credits, status } = yield getPlayerDetails(decoded.username);
    let existingPlayer = exports.currentActivePlayers.get(username);
    if (existingPlayer) {
        if (existingPlayer.playerData.userAgent !== userAgent) {
            socket.emit("AnotherDevice", "You are already playing on another browser.");
            socket.disconnect(true);
            throw (0, http_errors_1.default)(403, "Already playing on another device");
        }
        // Check for platform reconnection
        if (origin) {
            if (existingPlayer.platformData.socket && existingPlayer.platformData.socket.connected) {
                socket.emit("alert", "Platform already connected. Please disconnect the other session.");
                socket.disconnect(true);
                return;
            }
            else {
                console.log("Reinitializing platform connection");
                existingPlayer.initializePlatformSocket(socket);
                existingPlayer.sendAlert(`Platform reconnected for ${username}`, false);
                return;
            }
        }
        // Check for game connection, ensuring platform is ready
        if (gameId) {
            if (!existingPlayer.platformData.socket || !existingPlayer.platformData.socket.connected) {
                console.log("Platform connection required before joining a game.");
                socket.emit("internalError" /* messageType.ERROR */, "Platform connection required before joining a game.");
                socket.disconnect(true);
                return;
            }
            console.log("Game connection attempt detected, ensuring platform stability");
            yield existingPlayer.updateGameSocket(socket);
            existingPlayer.sendAlert(`Game initialized for ${username} in game ${gameId}`);
            return;
        }
    }
    // New connection handling with delay-based retry for stability
    if (origin) {
        console.log("New platform connection detected, initializing player");
        const newUser = new Player_1.default(username, decoded.role, status, credits, userAgent, socket);
        exports.currentActivePlayers.set(username, newUser);
        newUser.sendAlert(`Player initialized for ${newUser.playerData.username} on platform ${origin}`, false);
    }
    else {
        socket.emit("internalError" /* messageType.ERROR */, "You need to have an active platform connection before joining a game.");
        socket.disconnect(true);
    }
});
const handleManagerConnection = (socket, decoded, userAgent) => __awaiter(void 0, void 0, void 0, function* () {
    const username = decoded.username;
    const role = decoded.role;
    const { credits } = yield getManagerDetails(username);
    let existingManager = exports.currentActiveManagers.get(username);
    if (existingManager) {
        console.log(`Reinitializing manager ${username}`);
        if (existingManager.socketData.reconnectionTimeout) {
            clearTimeout(existingManager.socketData.reconnectionTimeout);
        }
        existingManager.initializeManager(socket);
        socket.emit("alert" /* messageType.ALERT */, `Manager ${username} has been reconnected.`);
    }
    else {
        const newManager = new Manager_1.default(username, credits, role, userAgent, socket);
        exports.currentActiveManagers.set(username, newManager);
        socket.emit("alert" /* messageType.ALERT */, `Manager ${username} has been connected.`);
    }
    // Send all active players to the manager upon connection
    const activeUsersData = Array.from(exports.currentActivePlayers.values()).map(player => {
        const platformSession = sessionManager_1.sessionManager.getPlatformSession(player.playerData.username);
        return (platformSession === null || platformSession === void 0 ? void 0 : platformSession.getSummary()) || {};
    });
    socket.emit("activePlayers", activeUsersData);
});
const socketController = (io) => {
    // Token verification middleware
    io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
        const userAgent = socket.request.headers['user-agent'];
        try {
            const decoded = yield verifySocketToken(socket);
            socket.decoded = Object.assign({}, decoded);
            socket.userAgent = userAgent;
            next();
        }
        catch (error) {
            console.error("Authentication error:", error.message);
            next(error);
        }
    }));
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const decoded = socket.decoded;
            const userAgent = socket.userAgent;
            const role = decoded.role;
            if (role === "player") {
                yield handlePlayerConnection(socket, decoded, userAgent);
            }
            else if (['company', 'master', 'distributor', 'subdistributor', 'store'].includes(role)) {
                yield handleManagerConnection(socket, decoded, userAgent);
            }
            else {
                console.error("Unsupported role : ", role);
                socket.disconnect(true);
            }
        }
        catch (error) {
            console.error("An error occurred during socket connection:", error.message);
            if (socket.connected) {
                socket.disconnect(true);
            }
        }
    }));
    // Error handling middleware
    io.use((socket, next) => {
        socket.on('error', (err) => {
            console.error('Socket Error:', err);
            socket.disconnect(true);
        });
        next();
    });
};
exports.default = socketController;
