import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { checkAuthorization } from "../services/authClient";
import { stegoService } from "../services/stegoService";

export class StegoController {
  async analyze(req: AuthRequest, res: Response) {
    try {
      const token = (req as any).token;
      const userId = req.user?.sub;
      const authz = await checkAuthorization(token, "steganography.analyze");
      if (!authz.allowed) {
        return res.status(403).json({ error: "forbidden", reason: authz.reason });
      }
      if (!req.file) {
        return res.status(400).json({ error: "no_file" });
      }
      const result = stegoService.analyzeLSB(req.file, userId);
      return res.json(result);
    } catch (e: any) {
      if (e.message === "no_file") return res.status(400).json({ error: "no_file" });
      if (e.message === "unsupported_format") return res.status(415).json({ error: "unsupported_format" });
      if (e.message === "file_too_large") return res.status(413).json({ error: "file_too_large" });
      if (e.message === "invalid_file") return res.status(400).json({ error: "invalid_file" });
      return res.status(500).json({ error: "internal_error" });
    }
  }

  async getResult(req: AuthRequest, res: Response) {
    try {
      const token = (req as any).token;
      const userId = req.user?.sub;
      const authz = await checkAuthorization(token, "steganography.results.read");
      if (!authz.allowed) {
        return res.status(403).json({ error: "forbidden", reason: authz.reason });
      }
      const result = stegoService.getResult(req.params.id, userId);
      return res.json(result);
    } catch (e: any) {
      if (e.message === "not_found") return res.status(404).json({ error: "not_found" });
      if (e.message === "forbidden") return res.status(403).json({ error: "forbidden" });
      return res.status(500).json({ error: "internal_error" });
    }
  }
}

export const stegoController = new StegoController();
