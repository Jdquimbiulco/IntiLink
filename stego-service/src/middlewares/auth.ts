import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: any;
  token?: string;
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
    req.token = token;
    next();
  } catch (e) {
    return res.status(401).json({ error: "unauthorized" });
  }
}
