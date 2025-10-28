// src/routes/upload.route.ts
import { Router } from "express";
import { getCloudinarySignature } from "../controllers/upload.controller";
import { createSignedUploadUrl } from "../controllers/supabaseUpload.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router = Router();

// Route: /api/uploads/cloudinary-signature
router.get("/cloudinary-signature", getCloudinarySignature);

// Supabase signed upload URL for Storage
router.post(
  "/supabase/signed-upload",
  authenticateToken,
  checkRole(["admin", "teacher"]),
  createSignedUploadUrl
);

export default router;
