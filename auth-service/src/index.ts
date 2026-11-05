import express from "express";
import https from "https";
import helmet from "helmet";
import cors from "cors";
import fs from "fs";
import path from "path";
import routes from "./routes";
import { env } from "./config/env";
import { pool } from "./config/db";

async function runMigrations() {
  try {
    const sqlPath = path.join(__dirname, "migrations", "001_init.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    await pool.query(sql);
    console.log("Migrations applied successfully");
  } catch (e) {
    console.error("Migration error:", e);
    process.exit(1);
  }
}

async function start() {
  await runMigrations();

  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

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
  app.use(routes);

  app.listen(env.port, () => {
    console.log(`Auth service running on port ${env.port}`);
  });
  const tlsKey = fs.readFileSync(env.tlsKeyPath);
  const tlsCert = fs.readFileSync(env.tlsCertPath);
  https.createServer({ key: tlsKey, cert: tlsCert }, app).listen(env.internalPort, () => {
    console.log(`Auth internal authorization service running on HTTPS port ${env.internalPort}`);
  });
}

start();
