"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const argon2_1 = __importDefault(require("argon2"));
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
async function hashPassword(password) {
    return argon2_1.default.hash(password);
}
async function verifyPassword(hash, password) {
    try {
        return await argon2_1.default.verify(hash, password);
    }
    catch {
        return false;
    }
}
function signToken(payload) {
    const privateKey = fs_1.default.readFileSync(env_1.env.jwtPrivateKeyPath);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jsonwebtoken_1.default.sign(payload, privateKey, {
        algorithm: "RS256",
        issuer: env_1.env.jwtIssuer,
        audience: env_1.env.jwtAudience,
        expiresIn: env_1.env.jwtExpiresIn
    });
}
function verifyToken(token) {
    const publicKey = fs_1.default.readFileSync(env_1.env.jwtPublicKeyPath);
    return jsonwebtoken_1.default.verify(token, publicKey, {
        algorithms: ["RS256"],
        issuer: env_1.env.jwtIssuer,
        audience: env_1.env.jwtAudience
    });
}
