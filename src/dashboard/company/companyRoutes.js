"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const companyController_1 = require("../company/companyController");
// import { createCompany } from "./companyController";
const companyRoutes = express_1.default.Router();
const company = new companyController_1.CompanyController();
// companyRoutes.post("/", createCompany);
companyRoutes.post('/request-otp', company.requestOTP);
companyRoutes.post('/verify-otp', company.verifyOTPAndCreateUser);
exports.default = companyRoutes;
