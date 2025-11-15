import express from "express";
import { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory } from "../controllers/category.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router = express.Router();
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.post("/", authenticateToken, checkRole(['admin']), createCategory);
router.put("/:id", authenticateToken, checkRole(['admin']), updateCategory);
router.delete("/:id", authenticateToken, checkRole(['admin']), deleteCategory);

export default router;