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
exports.playerDataType = exports.eventType = exports.getManagerName = exports.getSubordinateModel = exports.uploadImage = exports.updateCredits = exports.updatePassword = exports.updateStatus = exports.MESSAGEID = exports.rolesHierarchy = exports.clients = void 0;
exports.formatDate = formatDate;
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const transactionController_1 = require("../dashboard/transactions/transactionController");
const cloudinary_1 = require("cloudinary");
const config_1 = require("../config/config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const socket_1 = require("../socket");
const userModel_1 = require("../dashboard/users/userModel");
const transactionController = new transactionController_1.TransactionController();
exports.clients = new Map();
exports.rolesHierarchy = {
    company: ["master", "distributor", "subdistributor", "store", "player"],
    master: ["distributor"],
    distributor: ["subdistributor"],
    subdistributor: ["store"],
    store: ["player"],
};
cloudinary_1.v2.config({
    cloud_name: config_1.config.cloud_name,
    api_key: config_1.config.api_key,
    api_secret: config_1.config.api_secret,
});
var MESSAGEID;
(function (MESSAGEID) {
    MESSAGEID["AUTH"] = "AUTH";
    MESSAGEID["SPIN"] = "SPIN";
    MESSAGEID["GAMBLE"] = "GAMBLE";
    MESSAGEID["GENRTP"] = "GENRTP";
})(MESSAGEID || (exports.MESSAGEID = MESSAGEID = {}));
const updateStatus = (client, status) => {
    // Destroy SlotGame instance if we update user to inactive && the client is currently in a game
    const validStatuses = ["active", "inactive"];
    if (!validStatuses.includes(status)) {
        throw (0, http_errors_1.default)(400, "Invalid status value");
    }
    client.status = status;
    for (const [username, playerSocket] of socket_1.currentActivePlayers) {
        if (playerSocket) {
            const socketUser = socket_1.currentActivePlayers.get(client.username);
            if (socketUser) {
                if (status === 'inactive') {
                    socketUser.forceExit();
                }
            }
            else {
                console.warn(`User ${client.username} does not have a current game or settings.`);
            }
        }
    }
};
exports.updateStatus = updateStatus;
const updatePassword = (client, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Update password
        client.password = yield bcrypt_1.default.hash(password, 10);
    }
    catch (error) {
        console.log(error);
        throw error;
    }
});
exports.updatePassword = updatePassword;
const updateCredits = (client, creator, credits) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const clientSocket = socket_1.currentActivePlayers.get(client.username);
        if (clientSocket) {
            if (clientSocket.gameData.socket || clientSocket.currentGameData.gameId) {
                throw (0, http_errors_1.default)(409, "Cannot recharge while in a game");
            }
        }
        const agentSocket = socket_1.currentActiveManagers.get(client.username);
        const managerSocket = socket_1.currentActiveManagers.get(creator.username);
        const { type, amount } = credits;
        // Validate credits
        if (!type ||
            typeof amount !== "number" ||
            !["recharge", "redeem"].includes(type)) {
            throw (0, http_errors_1.default)(400, "Credits must include a valid type ('recharge' or 'redeem') and a numeric amount");
        }
        const transaction = yield transactionController.createTransaction(type, creator, client, amount, session);
        // Add the transaction to both users' transactions arrays
        client.transactions.push(transaction._id);
        creator.transactions.push(transaction._id);
        yield client.save({ session });
        yield creator.save({ session });
        if (managerSocket &&
            managerSocket.socketData.socket) {
            managerSocket.sendData({
                type: "CREDITS",
                payload: { credits: creator.credits, role: creator.role }
            });
            managerSocket.credits = creator.credits;
        }
        if (agentSocket && agentSocket.socketData.socket) {
            agentSocket.sendData({
                type: "CREDITS",
                payload: { credits: client.credits, role: client.role }
            });
            agentSocket.credits = client.credits;
        }
        if (clientSocket && clientSocket.platformData.socket && clientSocket.platformData.socket.connected) {
            clientSocket.playerData.credits = client.credits;
            clientSocket.sendData({ type: playerDataType.CREDIT, data: { credits: client.credits } }, "platform");
            clientSocket.playerData.credits = client.credits;
        }
        yield session.commitTransaction();
        session.endSession();
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
exports.updateCredits = updateCredits;
const uploadImage = (image) => {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader.upload(image, { folder: "casinoGames" }, (error, result) => {
            if (result && result.secure_url) {
                // console.log(result.secure_url);
                return resolve(result.secure_url);
            }
            console.log(error.message);
            return reject({ message: error.message });
        });
    });
};
exports.uploadImage = uploadImage;
const getSubordinateModel = (role) => {
    const rolesHierarchy = {
        company: "User",
        master: "User",
        distributor: "User",
        subdistributor: "User",
        store: "Player",
    };
    return rolesHierarchy[role];
};
exports.getSubordinateModel = getSubordinateModel;
const getManagerName = (username) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch the player and populate the 'createdBy' field
        const player = yield userModel_1.Player.findOne({ username }).populate("createdBy").exec();
        if (!player) {
            console.error(`Player ${username} not found in the database.`);
            return null;
        }
        // Check if 'createdBy' is populated and return the manager's name
        const manager = player.createdBy;
        if (manager && manager.name) {
            return manager.name;
        }
        else {
            console.log(`No manager found for player ${username}`);
            return null;
        }
    }
    catch (error) {
        console.error(`Error fetching manager for player ${username}:`, error);
        return null;
    }
});
exports.getManagerName = getManagerName;
var eventType;
(function (eventType) {
    eventType["ENTERED_PLATFORM"] = "ENTERED_PLATFORM";
    eventType["EXITED_PLATFORM"] = "EXITED_PLATFORM";
    eventType["ENTERED_GAME"] = "ENTERED_GAME";
    eventType["EXITED_GAME"] = "EXITED_GAME";
    eventType["GAME_SPIN"] = "HIT_SPIN";
    eventType["UPDATED_SPIN"] = "UPDATED_SPIN";
})(eventType || (exports.eventType = eventType = {}));
var playerDataType;
(function (playerDataType) {
    playerDataType["CREDIT"] = "CREDIT";
    playerDataType["GAMES"] = "GAMES";
})(playerDataType || (exports.playerDataType = playerDataType = {}));
function formatDate(isoString) {
    const date = new Date(isoString);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    });
    return `${formattedDate} at ${formattedTime}`;
}
