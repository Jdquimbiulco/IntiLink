"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuthorization = checkAuthorization;
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("../config/env");
async function checkAuthorization(subject_token, action) {
    try {
        const res = await axios_1.default.post(`${env_1.env.authServiceUrl}/internal/authorization/check`, { subject_token, action }, {
            headers: { "x-service-token": env_1.env.serviceToken },
            timeout: 3000,
            httpsAgent: env_1.env.authServiceUrl.startsWith("https://")
                ? new https_1.default.Agent({ ca: fs_1.default.readFileSync(env_1.env.authCaCertPath), rejectUnauthorized: true })
                : undefined
        });
        return res.data;
    }
    catch (e) {
        if (e.response?.data)
            return e.response.data;
        return { allowed: false, reason: "auth_unavailable" };
    }
}
