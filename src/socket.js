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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redisClient_1 = require("./redisClient"); // Import Redis clients
const config_1 = require("./config/config");
const userModel_1 = require("./dashboard/users/userModel");
const sessionManager_1 = require("./dashboard/session/sessionManager");
const Player_1 = __importDefault(require("./Player"));
const Manager_1 = __importDefault(require("./Manager"));
const verifySocketToken = (socket) => {
    return new Promise((resolve, reject) => {
        const token = socket.handshake.auth.token;
        if (token) {
            jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret, (err, decoded) => {
                if (err) {
                    console.error("❌ Token verification failed:", err.message);
                    reject(new Error("Authentication failed"));
                }
                else if (!decoded || !decoded.username) {
                    reject(new Error("Token missing required fields"));
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
    var _a;
    const player = yield userModel_1.Player.findOne({ username }).populate("createdBy", "username");
    if (player) {
        return {
            credits: player.credits,
            status: player.status,
            managerName: ((_a = player.createdBy) === null || _a === void 0 ? void 0 : _a.username) || null
        };
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
// Save session data in Redis
const saveSession = (username, socketId) => __awaiter(void 0, void 0, void 0, function* () {
    yield redisClient_1.pubClient.hset(`session:${username}`, { socketId });
});
// Retrieve session data from Redis
const getSession = (username) => __awaiter(void 0, void 0, void 0, function* () {
    return yield redisClient_1.pubClient.hgetall(`session:${username}`);
});
// Remove session from Redis
const deleteSession = (username) => __awaiter(void 0, void 0, void 0, function* () {
    yield redisClient_1.pubClient.del(`session:${username}`);
});
const handlePlayerConnection = (socket, decoded, userAgent) => __awaiter(void 0, void 0, void 0, function* () {
    const username = decoded.username;
    const platformId = socket.handshake.auth.platformId;
    const origin = socket.handshake.auth.origin;
    const gameId = socket.handshake.auth.gameId;
    const { credits, status, managerName } = yield getPlayerDetails(username);
    let existingPlayer = yield getSession(username);
    if (existingPlayer === null || existingPlayer === void 0 ? void 0 : existingPlayer.socketId) {
        console.log(`🔄 Restoring previous session for ${username} on new server instance`);
        socket.emit("sessionRestored", { username });
    }
    yield saveSession(username, socket.id);
    // New player connection
    if (origin) {
        const newUser = new Player_1.default(username, decoded.role, status, credits, userAgent, socket, managerName);
        newUser.platformData.platformId = platformId;
        newUser.sendAlert(`✅ Player initialized for ${username} on platform ${origin}`, false);
        return;
    }
    socket.emit("error", "Invalid connection attempt.");
    socket.disconnect(true);
});
const handleManagerConnection = (socket, decoded, userAgent) => __awaiter(void 0, void 0, void 0, function* () {
    const username = decoded.username;
    const role = decoded.role;
    const { credits } = yield getManagerDetails(username);
    console.log(`✅ MANAGER CONNECTED: ${username}`);
    let existingManager = yield getSession(username);
    if (existingManager === null || existingManager === void 0 ? void 0 : existingManager.socketId) {
        console.log(`🔄 Restoring previous session for manager ${username}`);
        socket.emit("sessionRestored", { username });
    }
    yield saveSession(username, socket.id);
    const newManager = new Manager_1.default(username, credits, role, userAgent, socket);
    sessionManager_1.sessionManager.addManager(username, newManager);
    socket.emit("alert", `✅ Manager ${username} connected.`);
});
const socketController = (io) => {
    io.adapter((0, redis_adapter_1.createAdapter)(redisClient_1.pubClient, redisClient_1.subClient));
    io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
        const userAgent = socket.request.headers["user-agent"];
        try {
            const decoded = yield verifySocketToken(socket);
            socket.decoded = Object.assign({}, decoded);
            socket.userAgent = userAgent;
            next();
        }
        catch (error) {
            console.error("❌ Authentication error:", error.message);
            next(error);
        }
    }));
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        const instanceId = socket.instanceId;
        const decoded = socket.decoded;
        const userAgent = socket.userAgent;
        const role = decoded.role;
        console.log(`✅ User connected on EC2 instance: ${instanceId} | Role: ${role} | Socket ID: ${socket.id}`);
        try {
            if (role === "player") {
                yield handlePlayerConnection(socket, decoded, userAgent);
            }
            else if (["admin", "supermaster", "master", "distributor", "subdistributor", "store"].includes(role)) {
                yield handleManagerConnection(socket, decoded, userAgent);
            }
            else {
                console.error(`❌ Unsupported role: ${role}`);
                socket.disconnect(true);
            }
        }
        catch (error) {
            console.error("❌ Connection error:", error.message);
            socket.emit("alert", "ForcedExit");
            socket.disconnect(true);
        }
        socket.on("message", (msg) => {
            console.log(`📨 Message from ${socket.id} on ${instanceId}: ${msg}`);
            io.emit("message", msg);
        });
        socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const username = (_a = socket.decoded) === null || _a === void 0 ? void 0 : _a.username;
            if (username) {
                console.log(`🔴 User ${username} disconnected from EC2 instance: ${instanceId}`);
                yield deleteSession(username);
            }
        }));
    }));
};
exports.default = socketController;
