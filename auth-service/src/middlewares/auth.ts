import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/crypto";

export interface AuthRequest extends Request {
  user?: any;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const token = auth.substring("Bearer ".length);
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: "unauthorized" });
  }
}

export function requireRole(roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.sub;
      if (!userId) return res.status(401).json({ error: "unauthorized" });
      const { pool } = await import("../config/db");
      const result = await pool.query(
        `SELECT r.name FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = $1 AND r.status = 'active'`,
        [userId]
      );
      const userRoles = result.rows.map((r: any) => r.name);
      const has = roles.some((role) => userRoles.includes(role));
      if (!has) return res.status(403).json({ error: "forbidden" });
      next();
    } catch (e) {
      return res.status(403).json({ error: "forbidden" });
    }
  };
}
