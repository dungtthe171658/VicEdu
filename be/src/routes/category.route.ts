import express from "express";
import { createCategory, getCategories } from "../controllers/category.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router = express.Router();
router.get("/", getCategories);
router.post("/", authenticateToken, checkRole(['admin']), createCategory);

export default router;