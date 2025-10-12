import express from "express";
import { getAllCategories, getCategoryById } from "../controllers/category.controller";

const router = express.Router();

// Lấy toàn bộ category
router.get("/", getAllCategories);

// Lấy chi tiết 1 category theo id
router.get("/:id", getCategoryById);

export default router;
