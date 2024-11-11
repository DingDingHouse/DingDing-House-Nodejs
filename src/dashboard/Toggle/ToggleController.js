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
exports.ToggleController = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const ToggleModel_1 = __importDefault(require("./ToggleModel"));
class ToggleController {
    constructor() {
        this.getToggle = this.getToggle.bind(this);
        this.putToggle = this.putToggle.bind(this);
    }
    initializeToggle() {
        return __awaiter(this, void 0, void 0, function* () {
            return ToggleModel_1.default.findOneAndUpdate({}, { availableAt: null }, { new: true, upsert: true });
        });
    }
    //NOTE: GET toggle
    getToggle(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let toggle = yield ToggleModel_1.default.findOne({});
                if (!toggle) {
                    toggle = yield this.initializeToggle();
                }
                if (!toggle || toggle.availableAt === null) {
                    res.status(200).json({ underMaintenance: false });
                    return;
                }
                const now = new Date();
                if (new Date(toggle.availableAt) < now) {
                    yield this.initializeToggle();
                    res.status(200).json({ underMaintenance: false });
                }
                else {
                    res.status(200).json({ underMaintenance: true, availableAt: toggle.availableAt });
                }
            }
            catch (error) {
                console.log("Error : ", error);
                next(error);
            }
        });
    }
    //NOTE: Add new toggle
    putToggle(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _req = req;
                const { availableAt } = _req.body;
                if (!availableAt)
                    throw (0, http_errors_1.default)(400, "availableAt is required");
                const now = new Date();
                if (availableAt === "null") {
                    const toggle = yield this.initializeToggle();
                    res.status(200).json({ message: "Toggle updated successfully", availableAt: toggle.availableAt });
                }
                else {
                    const time = new Date(availableAt);
                    if (time < now)
                        throw (0, http_errors_1.default)(400, "availableAt is invalid");
                    const toggle = yield ToggleModel_1.default.findOneAndUpdate({}, { availableAt }, { new: true, upsert: true });
                    res.status(200).json({ message: "Toggle updated successfully", availableAt: toggle.availableAt });
                }
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.ToggleController = ToggleController;
