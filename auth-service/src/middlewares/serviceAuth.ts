import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export function serviceAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["x-service-token"];
  if (!token || token !== env.serviceToken) {
    return res.status(401).json({ error: "unauthorized_service" });
  }
  next();
}
