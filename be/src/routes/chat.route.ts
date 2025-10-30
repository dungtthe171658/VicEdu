import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { authenticateToken } from "../middlewares/auth";

const router = Router();
const chatController = new ChatController();

// Yêu cầu xác thực cho tất cả endpoint chat
router.use(authenticateToken);

// Gửi tin nhắn và nhận phản hồi từ AI
router.post("/send", chatController.sendMessage.bind(chatController));

// Lấy lịch sử chat của người dùng hiện tại
router.get("/history", chatController.getChatHistory.bind(chatController));

// Xóa toàn bộ lịch sử chat
router.delete("/clear", chatController.clearChatHistory.bind(chatController));

// Lấy tất cả session chat (chỉ admin)
router.get("/sessions", chatController.getAllSessions.bind(chatController));

export default router;
