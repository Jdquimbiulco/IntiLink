import { Router } from "express";
import { authController } from "../controllers/authController";
import { authenticate, requireRole } from "../middlewares/auth";
import { serviceAuth } from "../middlewares/serviceAuth";
import rateLimit from "express-rate-limit";

const router = Router();

const loginLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

router.post("/api/auth/login", loginLimiter, authController.login);
router.get("/api/auth/profile", authenticate, authController.profile);
router.post("/api/auth/logout", authenticate, authController.logout);

router.post("/api/users", authenticate, requireRole(["ADMIN"]), authController.createUser);
router.get("/api/users", authenticate, requireRole(["ADMIN"]), authController.listUsers);
router.patch("/api/users/:id", authenticate, requireRole(["ADMIN"]), authController.updateUser);

router.post("/api/roles", authenticate, requireRole(["ADMIN"]), authController.createRole);
router.get("/api/roles", authenticate, requireRole(["ADMIN"]), authController.listRoles);
router.patch("/api/roles/:id", authenticate, requireRole(["ADMIN"]), authController.updateRole);

router.post("/api/user-roles", authenticate, requireRole(["ADMIN"]), authController.assignRole);
router.get("/api/user-roles", authenticate, requireRole(["ADMIN"]), authController.listUserRoles);
router.delete("/api/user-roles/:id", authenticate, requireRole(["ADMIN"]), authController.removeRole);

router.post("/internal/authorization/check", serviceAuth, authController.internalCheck);

export default router;
