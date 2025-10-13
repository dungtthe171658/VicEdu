import express from "express";
import authController from "../controllers/auth.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";
import passport from "../middlewares/passport";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/verify-email", authController.verifyEmail);

router.get("/admin", authenticateToken, checkRole(["admin"]), (req, res) => {
  res.send("Hello Admin!");
});

router.get("/organizer", authenticateToken, checkRole(["organizer", "admin"]), (req, res) => {
  res.send("Hello Organizer!");
});

router.get("/user", authenticateToken, checkRole(["user", "organizer", "admin"]), (req, res) => {
  res.send("Hello User!");
});

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/api/auth/google/failure" }),
  authController.googleSuccess
);

router.get("/google/failure", authController.googleFailure);

export default router;
