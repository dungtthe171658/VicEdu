import express, { Router } from "express";
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  updateBookStock,
} from "../controllers/book.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router: Router = express.Router();

// Public — ai cũng xem được danh sách sách
router.get("/", getBooks);
router.get("/:id", getBookById);
router.put("/:id/stock", authenticateToken, updateBookStock);

// Chỉ Admin hoặc Teacher mới được thêm/sửa/xóa/trừ stock
router.post("/", authenticateToken, checkRole(['admin', 'teacher']), createBook);
router.put("/:id", authenticateToken, checkRole(['admin', 'teacher']), updateBook);
router.delete("/:id", authenticateToken, checkRole(['admin', 'teacher']), deleteBook);

export default router;
