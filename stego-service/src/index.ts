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

app.get("/health", (req, res) => res.json({ status: "ok", service: "stego" }));

app.use(routes);

app.listen(env.port, () => {
  console.log(`Stego service running on port ${env.port}`);
});
