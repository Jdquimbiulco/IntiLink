"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = verifyToken;
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function verifyToken(token) {
    const publicKey = fs_1.default.readFileSync(env_1.env.authPublicKeyPath);
    return jsonwebtoken_1.default.verify(token, publicKey, {
        algorithms: ["RS256"],
        issuer: env_1.env.jwtIssuer,
        audience: env_1.env.jwtAudience
    });
}
