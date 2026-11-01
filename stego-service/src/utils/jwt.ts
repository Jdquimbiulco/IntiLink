import fs from "fs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function verifyToken(token: string): any {
  const publicKey = fs.readFileSync(env.authPublicKeyPath);
  return jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience
  });
}
