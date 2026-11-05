"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceAuth = serviceAuth;
const env_1 = require("../config/env");
function serviceAuth(req, res, next) {
    const token = req.headers["x-service-token"];
    if (!token || token !== env_1.env.serviceToken) {
        return res.status(401).json({ error: "unauthorized_service" });
    }
    next();
}
