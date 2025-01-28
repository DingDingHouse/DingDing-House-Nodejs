import express from "express";
import payoutController from "./payoutController";
import multer from "multer";

const payoutRoutes = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Create a new payout
payoutRoutes.post("/", upload.fields([{ name: "payoutFile" }]), payoutController.uploadNewVersion);

// Get Payout
payoutRoutes.get('/', payoutController.getPayouts)

// Get Payout versions name of a Game
payoutRoutes.get("/:tagName", payoutController.getPayoutVersionName);

// Update Active Payout version
payoutRoutes.patch("/:tagName", payoutController.updateActivePayout)

// Delete a payout by ID
payoutRoutes.delete("/:tagName/:version", payoutController.deletePayout);

export default payoutRoutes