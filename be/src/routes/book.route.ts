// routes/book.route.ts
/*import express, { Router } from "express";
import { checkAuth } from "../middlewares/middleware"; 
import {
  getBooks,
  createBook,
  updateBook,
  hideBook,
  deleteBook,
} from "../controllers/book.controller";

// Tạo router
const router: Router = express.Router();

// Public — ai cũng xem được danh sách sách
router.get("/", getBooks);

// Chỉ Admin hoặc Teacher mới được thêm/sửa/xóa
// Nếu bạn có logic phân quyền theo role, thêm vào sau này
router.post("/", checkAuth, createBook);
router.put("/:id", checkAuth, updateBook);

// Ẩn sách (soft delete)
router.put("/:id/hide", checkAuth, hideBook);

// Xóa sách hẳn (hard delete)
router.delete("/:id", checkAuth, deleteBook);

export default router;*/

// routes/book.route.ts
import express, { Router } from "express";
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  hideBook,
  deleteBook,
} from "../controllers/book.controller";

// Tạo router
const router: Router = express.Router();

// Public — ai cũng xem được danh sách sách
router.get("/", getBooks);

// Lấy sách theo ID
router.get("/:id", getBookById);

// Tạm thời bỏ checkAuth để test
router.post("/", createBook);
router.put("/:id", updateBook);

// Ẩn sách (soft delete)
router.put("/:id/hide", hideBook);

// Xóa sách hẳn (hard delete)
router.delete("/:id", deleteBook);

export default router;
