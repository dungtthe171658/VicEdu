// src/routes/upload.route.ts
import { Router } from "express";
import { getCloudinarySignature } from "../controllers/upload.controller";

const router = Router();

// Route: /api/uploads/cloudinary-signature
router.get("/cloudinary-signature", getCloudinarySignature);

export default router;
