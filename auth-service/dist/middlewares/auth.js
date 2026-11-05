"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
const crypto_1 = require("../utils/crypto");
function authenticate(req, res, next) {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith("Bearer ")) {
            return res.status(401).json({ error: "unauthorized" });
        }
        const token = auth.substring("Bearer ".length);
        const decoded = (0, crypto_1.verifyToken)(token);
        req.user = decoded;
        next();
    }
    catch (e) {
        return res.status(401).json({ error: "unauthorized" });
    }
}
function requireRole(roles) {
    return async (req, res, next) => {
        try {
            const userId = req.user?.sub;
            if (!userId)
                return res.status(401).json({ error: "unauthorized" });
            const { pool } = await Promise.resolve().then(() => __importStar(require("../config/db")));
            const result = await pool.query(`SELECT r.name FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         JOIN users u ON u.id = ur.user_id
         WHERE ur.user_id = $1 AND r.status = 'active' AND u.status = 'active'`, [userId]);
            const userRoles = result.rows.map((r) => r.name);
            const has = roles.some((role) => userRoles.includes(role));
            if (!has)
                return res.status(403).json({ error: "forbidden" });
            next();
        }
        catch (e) {
            return res.status(403).json({ error: "forbidden" });
        }
    };
}
