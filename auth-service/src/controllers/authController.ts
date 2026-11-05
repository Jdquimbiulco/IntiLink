import { Request, Response } from "express";
import { authService } from "../services/authService";
import { AuthRequest } from "../middlewares/auth";

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: "bad_request" });
      const result = await authService.login(username, password);
      return res.json(result);
    } catch (e: any) {
      if (e.message === "invalid_credentials") return res.status(401).json({ error: "invalid_credentials" });
      return res.status(500).json({ error: "internal_error" });
    }
  }

  async profile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.sub;
      const profile = await authService.getProfile(userId);
      return res.json(profile);
    } catch (e) {
      return res.status(404).json({ error: "not_found" });
    }
  }

  async logout(req: Request, res: Response) {
    // Stateless JWT - client discards token
    return res.json({ message: "logged_out" });
  }

  async createUser(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;
      const user = await authService.createUser(username, email, password);
      return res.status(201).json(user);
    } catch (e) {
      return res.status(400).json({ error: "bad_request" });
    }
  }

  async listUsers(req: Request, res: Response) {
    const users = await authService.listUsers();
    return res.json(users);
  }

  async updateUser(req: Request, res: Response) {
    try {
      const user = await authService.updateUser(req.params.id, req.body);
      return res.json(user);
    } catch (e) {
      return res.status(400).json({ error: "bad_request" });
    }
  }

  async createRole(req: Request, res: Response) {
    try {
      const { name, description } = req.body;
      const role = await authService.createRole(name, description);
      return res.status(201).json(role);
    } catch (e) {
      return res.status(400).json({ error: "bad_request" });
    }
  }

  async listRoles(req: Request, res: Response) {
    const roles = await authService.listRoles();
    return res.json(roles);
  }

  async updateRole(req: Request, res: Response) {
    try {
      const role = await authService.updateRole(req.params.id, req.body);
      return res.json(role);
    } catch (e) {
      return res.status(400).json({ error: "bad_request" });
    }
  }

  async assignRole(req: Request, res: Response) {
    try {
      const { user_id, role_id } = req.body;
      const assignment = await authService.assignRole(user_id, role_id);
      return res.status(201).json(assignment);
    } catch (e: any) {
      if (e.message === "duplicate_assignment") return res.status(409).json({ error: "duplicate_assignment" });
      return res.status(400).json({ error: "bad_request" });
    }
  }

  async removeRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user_id, role_id } = { ...req.query, ...req.body };
      const result = await authService.removeRole(id, user_id as string, role_id as string);
      return res.json(result);
    } catch (e: any) {
      if (e.message === "not_found") {
        return res.status(404).json({
          error: "assignment_not_found",
          message: "No se encontró la asignación de rol. Asegúrate de usar el campo 'id' de la asignación obtenido en GET /api/user-roles (no el role_id ni el user_id)."
        });
      }
      return res.status(400).json({ error: "bad_request" });
    }
  }

  async listUserRoles(req: Request, res: Response) {
    try {
      const list = await authService.listUserRoles();
      return res.json(list);
    } catch (e) {
      return res.status(500).json({ error: "internal_error" });
    }
  }

  async internalCheck(req: Request, res: Response) {
    try {
      const { subject_token, action } = req.body;
      const result = await authService.checkAuthorization(subject_token, action);
      if (!result.allowed) return res.status(403).json(result);
      return res.json(result);
    } catch (e) {
      return res.status(403).json({ allowed: false, reason: "denied" });
    }
  }
}

export const authController = new AuthController();
