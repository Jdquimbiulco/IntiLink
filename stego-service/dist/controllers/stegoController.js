"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stegoController = exports.StegoController = void 0;
const authClient_1 = require("../services/authClient");
const stegoService_1 = require("../services/stegoService");
class StegoController {
    async analyze(req, res) {
        try {
            const token = req.token;
            const userId = req.user?.sub;
            if (!token || !userId)
                return res.status(401).json({ error: "unauthorized" });
            const authz = await (0, authClient_1.checkAuthorization)(token, "steganography.analyze");
            if (!authz.allowed) {
                console.warn(`[AUDIT] [STEGO_ANALYSIS_DENIED] User: ${userId} | Reason: ${authz.reason}`);
                return res.status(403).json({ error: "forbidden", reason: authz.reason });
            }
            if (!req.file) {
                return res.status(400).json({ error: "no_file" });
            }
            const result = stegoService_1.stegoService.analyzeLSB(req.file, userId);
            console.log(`[AUDIT] [STEGO_ANALYSIS_SUCCESS] User: ${userId} | File: '${req.file.originalname}' (${req.file.size} bytes) | SHA256: ${result.sha256} | Status: ${result.status} | Action: ${result.action}`);
            return res.json(result);
        }
        catch (e) {
            if (e.message === "no_file")
                return res.status(400).json({ error: "no_file" });
            if (e.message === "unsupported_format")
                return res.status(415).json({ error: "unsupported_format" });
            if (e.message === "file_too_large")
                return res.status(413).json({ error: "file_too_large" });
            if (e.message === "invalid_file")
                return res.status(400).json({ error: "invalid_file" });
            return res.status(500).json({ error: "internal_error" });
        }
    }
    async getResult(req, res) {
        try {
            const token = req.token;
            const userId = req.user?.sub;
            if (!token || !userId)
                return res.status(401).json({ error: "unauthorized" });
            const authz = await (0, authClient_1.checkAuthorization)(token, "steganography.results.read");
            if (!authz.allowed) {
                console.warn(`[AUDIT] [STEGO_RESULT_DENIED] User: ${userId} | Reason: ${authz.reason}`);
                return res.status(403).json({ error: "forbidden", reason: authz.reason });
            }
            const result = stegoService_1.stegoService.getResult(req.params.id, userId);
            console.log(`[AUDIT] [STEGO_RESULT_ACCESSED] User: ${userId} | Analysis ID: ${req.params.id}`);
            return res.json(result);
        }
        catch (e) {
            if (e.message === "not_found")
                return res.status(404).json({ error: "not_found" });
            if (e.message === "forbidden")
                return res.status(403).json({ error: "forbidden" });
            return res.status(500).json({ error: "internal_error" });
        }
    }
}
exports.StegoController = StegoController;
exports.stegoController = new StegoController();
