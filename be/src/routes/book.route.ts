import express, { Router } from "express";
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getPurchasedBooks,
  getBookOrderAndOrderitem,
  getBookPdfUrl,
  getPurchasedBookIds,
  getMyBooksFromHistory,
} from "../controllers/book.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router: Router = express.Router();

// Public — ai cũng xem được danh sách sách
router.get("/", getBooks);
// Purchased should be defined before dynamic :id to avoid conflicts
router.get("/purchased", authenticateToken, getBookOrderAndOrderitem);
router.get("/purchased/ids", authenticateToken, getPurchasedBookIds);
// Lấy sách đã mua từ bookHistory (không dùng getBookOrderAndOrderitem)
router.get("/my-books", authenticateToken, getMyBooksFromHistory);
router.get("/:id/pdf", authenticateToken, getBookPdfUrl);
router.get("/:id", getBookById);

// Chỉ Admin hoặc Teacher mới được thêm/sửa/xóa
router.post(
  "/",
  authenticateToken,
  checkRole(["admin", "teacher"]),
  createBook
);
router.put(
  "/:id",
  authenticateToken,
  checkRole(["admin", "teacher"]),
  updateBook
);
router.delete(
  "/:id",
  authenticateToken,
  checkRole(["admin", "teacher"]),
  deleteBook
);

export default router;
