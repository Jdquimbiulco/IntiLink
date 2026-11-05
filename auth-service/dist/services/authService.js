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
exports.authService = exports.AuthService = void 0;
const db_1 = require("../config/db");
const crypto_1 = require("../utils/crypto");
class AuthService {
    async login(username, password) {
        const result = await db_1.pool.query("SELECT * FROM users WHERE username = $1 OR email = $1", [username]);
        const user = result.rows[0];
        if (!user || user.status !== "active") {
            console.warn(`[AUDIT] [LOGIN_FAILED] Invalid username or inactive user: '${username}'`);
            throw new Error("invalid_credentials");
        }
        const ok = await (0, crypto_1.verifyPassword)(user.password_hash, password);
        if (!ok) {
            console.warn(`[AUDIT] [LOGIN_FAILED] Bad password for user: '${username}'`);
            throw new Error("invalid_credentials");
        }
        const token = (0, crypto_1.signToken)({ sub: user.id, username: user.username });
        console.log(`[AUDIT] [LOGIN_SUCCESS] User '${user.username}' (id: ${user.id}) logged in successfully`);
        return { access_token: token, token_type: "Bearer", expires_in: "15m" };
    }
    async getProfile(userId) {
        const result = await db_1.pool.query("SELECT id, username, email, status, created_at FROM users WHERE id = $1", [userId]);
        const user = result.rows[0];
        if (!user)
            throw new Error("not_found");
        if (user.status !== "active")
            throw new Error("inactive_user");
        const rolesRes = await db_1.pool.query(`SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1 AND r.status = 'active'`, [userId]);
        return { ...user, roles: rolesRes.rows.map((r) => r.name) };
    }
    async createUser(username, email, password) {
        const password_hash = await (0, crypto_1.hashPassword)(password);
        const result = await db_1.pool.query("INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING id, username, email, status", [username, email, password_hash]);
        return result.rows[0];
    }
    async updateUser(id, data) {
        const fields = [];
        const values = [];
        let i = 1;
        if (data.status) {
            fields.push(`status = $${i++}`);
            values.push(data.status);
        }
        if (data.email) {
            fields.push(`email = $${i++}`);
            values.push(data.email);
        }
        if (data.password) {
            const h = await (0, crypto_1.hashPassword)(data.password);
            fields.push(`password_hash = $${i++}`);
            values.push(h);
        }
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const result = await db_1.pool.query(`UPDATE users SET ${fields.join(",")} WHERE id = $${i} RETURNING id, username, email, status`, values);
        return result.rows[0];
    }
    async listUsers() {
        const result = await db_1.pool.query("SELECT id, username, email, status, created_at FROM users ORDER BY created_at DESC");
        return result.rows;
    }
    async createRole(name, description) {
        const result = await db_1.pool.query("INSERT INTO roles (name, description) VALUES ($1,$2) RETURNING *", [name, description]);
        return result.rows[0];
    }
    async listRoles() {
        const result = await db_1.pool.query("SELECT * FROM roles ORDER BY name");
        return result.rows;
    }
    async updateRole(id, data) {
        const fields = [];
        const values = [];
        let i = 1;
        if (data.status) {
            fields.push(`status = $${i++}`);
            values.push(data.status);
        }
        if (data.description) {
            fields.push(`description = $${i++}`);
            values.push(data.description);
        }
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const result = await db_1.pool.query(`UPDATE roles SET ${fields.join(",")} WHERE id = $${i} RETURNING *`, values);
        return result.rows[0];
    }
    async assignRole(user_id, role_id) {
        try {
            const result = await db_1.pool.query("INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2) RETURNING *", [user_id, role_id]);
            console.log(`[AUDIT] [ROLE_ASSIGNED] Assignment id: ${result.rows[0].id} | user_id: ${user_id} | role_id: ${role_id}`);
            return result.rows[0];
        }
        catch (e) {
            if (e.code === "23505") {
                console.warn(`[AUDIT] [ROLE_ASSIGNMENT_DUPLICATE] Duplicate role assignment attempt for user: ${user_id}, role: ${role_id}`);
                throw new Error("duplicate_assignment");
            }
            throw e;
        }
    }
    async listUserRoles() {
        const result = await db_1.pool.query(`
      SELECT ur.id, ur.user_id, u.username, ur.role_id, r.name AS role_name, ur.assigned_at
      FROM user_roles ur
      JOIN users u ON u.id = ur.user_id
      JOIN roles r ON r.id = ur.role_id
      ORDER BY ur.assigned_at DESC
    `);
        return result.rows;
    }
    async removeRole(id, userId, roleId) {
        // 1. Si especifican user_id y role_id explícitamente (vía body o query)
        if (userId && roleId) {
            const res = await db_1.pool.query("DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2 RETURNING id, user_id, role_id", [userId, roleId]);
            if (res.rowCount && res.rowCount > 0) {
                console.log(`[AUDIT] [ROLE_REMOVED] Revoked role ${roleId} from user ${userId}`);
                return { removed: true, deleted_count: res.rowCount };
            }
            throw new Error("not_found");
        }
        // 2. Si pasaron un ID en la URL
        if (id) {
            // 2a. Intentar borrar por ID primario de la asignación (user_roles.id)
            let res = await db_1.pool.query("DELETE FROM user_roles WHERE id = $1 RETURNING id, user_id, role_id", [id]);
            if (res.rowCount && res.rowCount > 0) {
                console.log(`[AUDIT] [ROLE_REMOVED] Assignment id: ${id} revoked successfully`);
                return { removed: true, deleted_count: res.rowCount };
            }
            // 2b. Si se envió user_id complementario y el 'id' era el role_id
            if (userId) {
                res = await db_1.pool.query("DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2 RETURNING id", [userId, id]);
                if (res.rowCount && res.rowCount > 0) {
                    console.log(`[AUDIT] [ROLE_REMOVED] Role ${id} revoked for user ${userId}`);
                    return { removed: true, deleted_count: res.rowCount };
                }
            }
            // 2c. Si el 'id' enviado corresponde al role_id y tiene una única asignación activa
            const byRole = await db_1.pool.query("SELECT id, user_id FROM user_roles WHERE role_id = $1", [id]);
            if (byRole.rowCount === 1) {
                const assignmentId = byRole.rows[0].id;
                await db_1.pool.query("DELETE FROM user_roles WHERE id = $1", [assignmentId]);
                console.log(`[AUDIT] [ROLE_REMOVED] Resolved role_id: ${id} to assignment: ${assignmentId} and revoked`);
                return { removed: true, deleted_count: 1 };
            }
            throw new Error("not_found");
        }
        throw new Error("not_found");
    }
    async checkAuthorization(subject_token, action) {
        try {
            const { verifyToken } = await Promise.resolve().then(() => __importStar(require("../utils/crypto")));
            const decoded = verifyToken(subject_token);
            const userId = decoded.sub;
            const result = await db_1.pool.query(`SELECT r.name FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         JOIN users u ON u.id = ur.user_id
         WHERE ur.user_id = $1 AND r.status = 'active' AND u.status = 'active'`, [userId]);
            const roles = result.rows.map((r) => r.name);
            // RBAC policy
            if (action === "steganography.analyze" && (roles.includes("ADMIN") || roles.includes("ANALYST"))) {
                console.log(`[AUDIT] [AUTHZ_DECISION] User: ${userId} | Action: ${action} | Decision: ALLOWED | Reason: active_role_grants_permission`);
                return { subject_id: userId, action, allowed: true, reason: "active_role_grants_permission" };
            }
            if (action === "steganography.results.read" && roles.length > 0) {
                console.log(`[AUDIT] [AUTHZ_DECISION] User: ${userId} | Action: ${action} | Decision: ALLOWED | Reason: active_role_grants_permission`);
                return { subject_id: userId, action, allowed: true, reason: "active_role_grants_permission" };
            }
            console.warn(`[AUDIT] [AUTHZ_DECISION] User: ${userId} | Action: ${action} | Decision: DENIED | Reason: insufficient_role`);
            return { subject_id: userId, action, allowed: false, reason: "insufficient_role" };
        }
        catch (e) {
            console.error(`[AUDIT] [AUTHZ_DECISION] Invalid token or verification failure`);
            return { allowed: false, reason: "invalid_token_or_context" };
        }
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
