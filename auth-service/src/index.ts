import express from "express";
import helmet from "helmet";
import cors from "cors";
import routes from "./routes";
import { env } from "./config/env";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok", service: "auth" }));

app.use(routes);

app.listen(env.port, () => {
  console.log(`Auth service running on port ${env.port}`);
});
