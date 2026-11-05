"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jwt_1 = require("../utils/jwt");
function authenticate(req, res, next) {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith("Bearer ")) {
            return res.status(401).json({ error: "unauthorized" });
        }
        const token = auth.substring("Bearer ".length);
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = decoded;
        req.token = token;
        next();
    }
    catch (e) {
        return res.status(401).json({ error: "unauthorized" });
    }
}
