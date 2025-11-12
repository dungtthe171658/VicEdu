import express, { Router } from "express";
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  updateBookStock,
  getPurchasedBooks,
} from "../controllers/book.controller";

import { authenticateToken, checkRole, AuthRequest } from "../middlewares/auth";
import { uploadPDF } from "../middlewares/uploadPDF";
import Book from "../models/book.model";
import Order from "../models/order.model";
import mongoose from "mongoose";

const router: Router = express.Router();

// ======================
// 🔒 Lấy danh sách sách đã mua của user
router.get("/purchased", authenticateToken, getPurchasedBooks);

// ======================
// Public — ai cũng xem được danh sách sách
router.get("/", getBooks);
router.get("/:id", getBookById);

// ======================
// Cập nhật stock (admin/teacher)
router.put("/:id/stock", authenticateToken, updateBookStock);

// ======================
// Chỉ Admin hoặc Teacher mới được thêm/sửa/xóa
router.post(
  "/",
  authenticateToken,
  checkRole(["admin", "teacher"]),
  uploadPDF.single("pdf"),
  createBook
);

router.put(
  "/:id",
  authenticateToken,
  checkRole(["admin", "teacher"]),
  uploadPDF.single("pdf"),
  updateBook
);

router.delete(
  "/:id",
  authenticateToken,
  checkRole(["admin", "teacher"]),
  deleteBook
);

// ======================
// 🔒 Chỉ user đã mua mới xem được pdf_url
router.get("/:id/pdf", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userPayload = req.user as any;
    const userId = userPayload?._id || userPayload?.id;
    if (!userId) return res.status(401).json({ message: "Chưa xác thực" });

    const bookId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookId))
      return res.status(400).json({ message: "Book ID không hợp lệ" });

    const purchasedOrder = await Order.findOne({
      user_id: userId,
      status: "completed",
      "meta.books": new mongoose.Types.ObjectId(bookId),
    });

    if (!purchasedOrder)
      return res.status(403).json({ message: "Bạn chưa mua sách này" });

    const book = await Book.findById(bookId).select("pdf_url");
    if (!book || !book.pdf_url)
      return res.status(404).json({ message: "PDF không tồn tại" });

    res.json({ pdf_url: book.pdf_url });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

export default router;
