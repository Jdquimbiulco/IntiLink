import { pool } from "../config/db";
import { hashPassword, verifyPassword, signToken } from "../utils/crypto";

export class AuthService {
  async login(username: string, password: string) {
    const result = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $1", [username]);
    const user = result.rows[0];
    if (!user || user.status !== "active") throw new Error("invalid_credentials");
    const ok = await verifyPassword(user.password_hash, password);
    if (!ok) throw new Error("invalid_credentials");
    const token = signToken({ sub: user.id, username: user.username });
    return { access_token: token, token_type: "Bearer", expires_in: "15m" };
  }

  async getProfile(userId: string) {
    const result = await pool.query("SELECT id, username, email, status, created_at FROM users WHERE id = $1", [userId]);
    const user = result.rows[0];
    if (!user) throw new Error("not_found");
    const rolesRes = await pool.query(
      `SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1 AND r.status = 'active'`,
      [userId]
    );
    return { ...user, roles: rolesRes.rows.map((r: any) => r.name) };
  }

  async createUser(username: string, email: string, password: string) {
    const password_hash = await hashPassword(password);
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING id, username, email, status",
      [username, email, password_hash]
    );
    return result.rows[0];
  }

  async updateUser(id: string, data: any) {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.status) { fields.push(`status = $${i++}`); values.push(data.status); }
    if (data.email) { fields.push(`email = $${i++}`); values.push(data.email); }
    if (data.password) { const h = await hashPassword(data.password); fields.push(`password_hash = $${i++}`); values.push(h); }
    fields.push(`updated_at = NOW()`);
    values.push(id);
    const result = await pool.query(`UPDATE users SET ${fields.join(",")} WHERE id = $${i} RETURNING id, username, email, status`, values);
    return result.rows[0];
  }

  async listUsers() {
    const result = await pool.query("SELECT id, username, email, status, created_at FROM users ORDER BY created_at DESC");
    return result.rows;
  }

  async createRole(name: string, description: string) {
    const result = await pool.query("INSERT INTO roles (name, description) VALUES ($1,$2) RETURNING *", [name, description]);
    return result.rows[0];
  }

  async listRoles() {
    const result = await pool.query("SELECT * FROM roles ORDER BY name");
    return result.rows;
  }

  async updateRole(id: string, data: any) {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.status) { fields.push(`status = $${i++}`); values.push(data.status); }
    if (data.description) { fields.push(`description = $${i++}`); values.push(data.description); }
    fields.push(`updated_at = NOW()`);
    values.push(id);
    const result = await pool.query(`UPDATE roles SET ${fields.join(",")} WHERE id = $${i} RETURNING *`, values);
    return result.rows[0];
  }

  async assignRole(user_id: string, role_id: string) {
    try {
      const result = await pool.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2) RETURNING *",
        [user_id, role_id]
      );
      return result.rows[0];
    } catch (e: any) {
      if (e.code === "23505") throw new Error("duplicate_assignment");
      throw e;
    }
  }

  async removeRole(id: string) {
    await pool.query("DELETE FROM user_roles WHERE id = $1", [id]);
    return { removed: true };
  }

  async checkAuthorization(subject_token: string, action: string) {
    try {
      const { verifyToken } = await import("../utils/crypto");
      const decoded: any = verifyToken(subject_token);
      const userId = decoded.sub;
      const result = await pool.query(
        `SELECT r.name FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         JOIN users u ON u.id = ur.user_id
         WHERE ur.user_id = $1 AND r.status = 'active' AND u.status = 'active'`,
        [userId]
      );
      const roles = result.rows.map((r: any) => r.name);
      // RBAC policy
      if (action === "steganography.analyze" && (roles.includes("ADMIN") || roles.includes("ANALYST"))) {
        return { subject_id: userId, action, allowed: true, reason: "active_role_grants_permission" };
      }
      if (action === "steganography.results.read" && roles.length > 0) {
        return { subject_id: userId, action, allowed: true, reason: "active_role_grants_permission" };
      }
      return { subject_id: userId, action, allowed: false, reason: "insufficient_role" };
    } catch (e) {
      return { allowed: false, reason: "invalid_token_or_context" };
    }
  }
}

export const authService = new AuthService();
