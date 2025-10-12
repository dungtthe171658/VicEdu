import express from "express";
import { getCategories, getCategoryById } from "../controllers/category.controller";

const router = express.Router();

// Lấy toàn bộ category
router.get("/", getCategories);

// Lấy chi tiết 1 category theo id
router.get("/:id", getCategoryById);

export default router;
