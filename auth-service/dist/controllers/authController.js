"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const authService_1 = require("../services/authService");
class AuthController {
    async login(req, res) {
        try {
            const { username, password } = req.body;
            if (!username || !password)
                return res.status(400).json({ error: "bad_request" });
            const result = await authService_1.authService.login(username, password);
            return res.json(result);
        }
        catch (e) {
            if (e.message === "invalid_credentials")
                return res.status(401).json({ error: "invalid_credentials" });
            return res.status(500).json({ error: "internal_error" });
        }
    }
    async profile(req, res) {
        try {
            const userId = req.user?.sub;
            const profile = await authService_1.authService.getProfile(userId);
            return res.json(profile);
        }
        catch (e) {
            if (e.message === "inactive_user")
                return res.status(403).json({ error: "forbidden" });
            return res.status(404).json({ error: "not_found" });
        }
    }
    async logout(req, res) {
        // Stateless JWT - client discards token
        return res.json({ message: "logged_out" });
    }
    async createUser(req, res) {
        try {
            const { username, email, password } = req.body;
            const user = await authService_1.authService.createUser(username, email, password);
            return res.status(201).json(user);
        }
        catch (e) {
            return res.status(400).json({ error: "bad_request" });
        }
    }
    async listUsers(req, res) {
        const users = await authService_1.authService.listUsers();
        return res.json(users);
    }
    async updateUser(req, res) {
        try {
            const user = await authService_1.authService.updateUser(req.params.id, req.body);
            return res.json(user);
        }
        catch (e) {
            return res.status(400).json({ error: "bad_request" });
        }
    }
    async createRole(req, res) {
        try {
            const { name, description } = req.body;
            const role = await authService_1.authService.createRole(name, description);
            return res.status(201).json(role);
        }
        catch (e) {
            return res.status(400).json({ error: "bad_request" });
        }
    }
    async listRoles(req, res) {
        const roles = await authService_1.authService.listRoles();
        return res.json(roles);
    }
    async updateRole(req, res) {
        try {
            const role = await authService_1.authService.updateRole(req.params.id, req.body);
            return res.json(role);
        }
        catch (e) {
            return res.status(400).json({ error: "bad_request" });
        }
    }
    async assignRole(req, res) {
        try {
            const { user_id, role_id } = req.body;
            const assignment = await authService_1.authService.assignRole(user_id, role_id);
            return res.status(201).json(assignment);
        }
        catch (e) {
            if (e.message === "duplicate_assignment")
                return res.status(409).json({ error: "duplicate_assignment" });
            return res.status(400).json({ error: "bad_request" });
        }
    }
    async removeRole(req, res) {
        try {
            const { id } = req.params;
            const { user_id, role_id } = { ...req.query, ...req.body };
            const result = await authService_1.authService.removeRole(id, user_id, role_id);
            return res.json(result);
        }
        catch (e) {
            if (e.message === "not_found") {
                return res.status(404).json({
                    error: "assignment_not_found",
                    message: "No se encontró la asignación de rol. Asegúrate de usar el campo 'id' de la asignación obtenido en GET /api/user-roles (no el role_id ni el user_id)."
                });
            }
            return res.status(400).json({ error: "bad_request" });
        }
    }
    async listUserRoles(req, res) {
        try {
            const list = await authService_1.authService.listUserRoles();
            return res.json(list);
        }
        catch (e) {
            return res.status(500).json({ error: "internal_error" });
        }
    }
    async internalCheck(req, res) {
        try {
            const { subject_token, action } = req.body;
            const result = await authService_1.authService.checkAuthorization(subject_token, action);
            if (!result.allowed)
                return res.status(403).json(result);
            return res.json(result);
        }
        catch (e) {
            return res.status(403).json({ allowed: false, reason: "denied" });
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
