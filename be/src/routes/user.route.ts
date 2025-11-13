import express from "express";
import {
  getAllUsers,
  getUserById,
  getMyProfile,
  getMyProfileFull,
  getMyAvatar,
  updateMyPassword,
  updateMyProfile,
  updateUser,
  lockUser,
  unlockUser,
  softDeleteUser,
  restoreUser,
updateMyAvatar,
  createUser,

} from "../controllers/user.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router = express.Router();

// Route cho người dùng tự lấy thông tin của mình (tất cả các role đã login đều được)
router.get("/me", authenticateToken, getMyProfile);
router.get("/me/full", authenticateToken, getMyProfileFull);
router.get("/me/avatar", authenticateToken, getMyAvatar);
// ✅ Cho phép user tự đổi avatar (chỉ cần đăng nhập, không cần role admin)
router.put("/me/avatar", authenticateToken, updateMyAvatar);
router.put("/me", authenticateToken, updateMyProfile);
router.put("/me/password", authenticateToken, updateMyPassword);

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
router.post("/", createUser);

export default router;
