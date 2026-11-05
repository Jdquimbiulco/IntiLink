"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const routes_1 = __importDefault(require("./routes"));
const env_1 = require("./config/env");
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
if (!fs_1.default.existsSync(env_1.env.uploadDir)) {
    fs_1.default.mkdirSync(env_1.env.uploadDir, { recursive: true });
}
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Middleware de bitácora de auditoría segura (T12 - Sin exponer secretos ni JWT completo)
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        const authHeader = req.headers.authorization;
        const maskedToken = authHeader && authHeader.startsWith("Bearer ")
            ? `${authHeader.substring(0, 15)}...${authHeader.substring(authHeader.length - 8)}`
            : "none";
        console.log(`[AUDIT] [STEGO-ACCESS] ${new Date().toISOString()} | ${req.method} ${req.path} | Status: ${res.statusCode} | Duration: ${duration}ms | Token: ${maskedToken}`);
    });
    next();
});
app.get("/health", (req, res) => res.json({ status: "ok", service: "stego" }));
app.use(routes_1.default);
app.use((error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "file_too_large" });
    }
    if (error)
        return res.status(400).json({ error: "invalid_multipart_request" });
    return next();
});
app.listen(env_1.env.port, () => {
    console.log(`Stego service running on port ${env_1.env.port}`);
});
