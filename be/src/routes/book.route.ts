import express, { Router } from "express";
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  updateBookStock,
  getPurchasedBooks,
  getBookOrderAndOrderitem,
  getBookPdfUrl,
} from "../controllers/book.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router: Router = express.Router();

// Public — ai cũng xem được danh sách sách
router.get("/", getBooks);
// Purchased should be defined before dynamic :id to avoid conflicts
router.get("/purchased", authenticateToken, getBookOrderAndOrderitem);
router.get("/:id/pdf", authenticateToken, getBookPdfUrl);
router.get("/:id", getBookById);
router.put("/:id/stock", authenticateToken, updateBookStock);

// Chỉ Admin hoặc Teacher mới được thêm/sửa/xóa/trừ stock
router.post("/", authenticateToken, checkRole(['admin', 'teacher']), createBook);
router.put("/:id", authenticateToken, checkRole(['admin', 'teacher']), updateBook);
router.delete("/:id", authenticateToken, checkRole(['admin', 'teacher']), deleteBook);

export default router;
