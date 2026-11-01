import { Router } from "express";
import multer from "multer";
import { stegoController } from "../controllers/stegoController";
import { authenticate } from "../middlewares/auth";
import { env } from "../config/env";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileSize }
});

router.post("/api/steganography/analyze", authenticate, upload.single("file"), stegoController.analyze);
router.get("/api/steganography/results/:id", authenticate, stegoController.getResult);

export default router;
