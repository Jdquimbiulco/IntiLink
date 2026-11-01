import argon2 from "argon2";
import fs from "fs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export function signToken(payload: object): string {
  const privateKey = fs.readFileSync(env.jwtPrivateKeyPath);
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
    expiresIn: env.jwtExpiresIn
  });
}

export function verifyToken(token: string): any {
  const publicKey = fs.readFileSync(env.jwtPublicKeyPath);
  return jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience
  });
}
