"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middlware_1 = require("../middleware/middlware");
const gameController_1 = require("../../dashboard/games/gameController");
const multer_1 = __importDefault(require("multer"));
const checkUser_1 = require("../middleware/checkUser");
const checkToggle_1 = require("../middleware/checkToggle");
const gameController = new gameController_1.GameController();
const gameRoutes = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit
// GET : Get all Games
gameRoutes.get("/", middlware_1.validateApiKey, checkUser_1.checkUser, checkToggle_1.checkGamesToggle, gameController.getGames);
// POST : Add a Game
gameRoutes.post('/', upload.fields([{ name: 'thumbnail' }, { name: 'payoutFile' }]), checkUser_1.checkUser, gameController.addGame);
// GET : Get All Platforms
gameRoutes.get("/platforms", checkUser_1.checkUser, gameController.getPlatforms);
// POST : Add a Platform
gameRoutes.post("/platforms", checkUser_1.checkUser, gameController.addPlatform);
gameRoutes.put("/:gameId", upload.fields([{ name: 'thumbnail' }, { name: 'payoutFile' }]), checkUser_1.checkUser, gameController.updateGame);
gameRoutes.delete("/:gameId", checkUser_1.checkUser, gameController.deleteGame);
gameRoutes.get("/:gameId", middlware_1.validateApiKey, checkUser_1.checkUser, gameController.getGameBySlug);
gameRoutes.put("/favourite/:playerId", middlware_1.extractRoleFromCookie, gameController.addFavouriteGame);
exports.default = gameRoutes;
