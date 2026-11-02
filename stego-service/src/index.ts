import express from "express";
import helmet from "helmet";
import cors from "cors";
import routes from "./routes";
import { env } from "./config/env";
import fs from "fs";

const app = express();

if (!fs.existsSync(env.uploadDir)) {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

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
    console.log(`[AUDIT] [STEGO-ACCESS] ${new Date().toISOString()} | ${req.method} ${req.path} | Status: ${res.statusCode} | Duration: ${duration}ms | Token: ${maskedToken}`);
  });
  next();
});

app.get("/health", (req, res) => res.json({ status: "ok", service: "stego" }));

app.use(routes);

app.listen(env.port, () => {
  console.log(`Stego service running on port ${env.port}`);
});
