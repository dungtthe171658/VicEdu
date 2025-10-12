import express from "express";
import {
  getAllUsers,
  getUserById,
  getMyProfile,
  updateUser,
  lockUser,
  unlockUser,
  softDeleteUser,
  restoreUser,
} from "../controllers/user.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router = express.Router();

// Route cho người dùng tự lấy thông tin của mình (tất cả các role đã login đều được)
router.get("/me", authenticateToken, getMyProfile);

// === CÁC ROUTES DƯỚI ĐÂY CHỈ DÀNH CHO ADMIN ===
router.use(authenticateToken, checkRole(['admin']));

// Lấy danh sách tất cả user
router.get("/", getAllUsers);

// Các hành động trên một user cụ thể
router.route("/:id")
  .get(getUserById)
  .put(updateUser)
  .delete(softDeleteUser); // DELETE sẽ là xóa mềm

// Các hành động đặc biệt
router.post("/:id/lock", lockUser);
router.post("/:id/unlock", unlockUser);
router.post("/:id/restore", restoreUser);

export default router;