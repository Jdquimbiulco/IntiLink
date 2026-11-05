"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const https_1 = __importDefault(require("https"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const env_1 = require("./config/env");
const db_1 = require("./config/db");
async function runMigrations() {
    try {
        const sqlPath = path_1.default.join(__dirname, "migrations", "001_init.sql");
        const sql = fs_1.default.readFileSync(sqlPath, "utf-8");
        await db_1.pool.query(sql);
        console.log("Migrations applied successfully");
    }
    catch (e) {
        console.error("Migration error:", e);
        process.exit(1);
    }
}
async function start() {
    await runMigrations();
    const app = (0, express_1.default)();
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
            console.log(`[AUDIT] [AUTH-ACCESS] ${new Date().toISOString()} | ${req.method} ${req.path} | Status: ${res.statusCode} | Duration: ${duration}ms | Token: ${maskedToken}`);
        });
        next();
    });
    app.get("/health", (req, res) => res.json({ status: "ok", service: "auth" }));
    app.use(routes_1.default);
    app.listen(env_1.env.port, () => {
        console.log(`Auth service running on port ${env_1.env.port}`);
    });
    const tlsKey = fs_1.default.readFileSync(env_1.env.tlsKeyPath);
    const tlsCert = fs_1.default.readFileSync(env_1.env.tlsCertPath);
    https_1.default.createServer({ key: tlsKey, cert: tlsCert }, app).listen(env_1.env.internalPort, () => {
        console.log(`Auth internal authorization service running on HTTPS port ${env_1.env.internalPort}`);
    });
}
start();
