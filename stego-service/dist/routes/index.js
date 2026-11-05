"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const stegoController_1 = require("../controllers/stegoController");
const auth_1 = require("../middlewares/auth");
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: env_1.env.maxFileSize }
});
router.post("/api/steganography/analyze", auth_1.authenticate, upload.single("file"), stegoController_1.stegoController.analyze);
router.get("/api/steganography/results/:id", auth_1.authenticate, stegoController_1.stegoController.getResult);
exports.default = router;
