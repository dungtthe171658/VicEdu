// routes/payment.route.ts
import { Router } from "express";
import { createPaymentLink, payosWebhook, vnpayReturn } from "../controllers/payment.controller";
import { authenticateToken as verifyToken } from "../middlewares/auth"; // hoặc verifyToken bạn đang dùng

const router = Router();

// Tạo link thanh toán (FE gọi)
router.post("/create-payment-link", verifyToken, createPaymentLink);

// Webhook PayOS (PayOS gọi)
router.post("/payos/webhook", payosWebhook);

// VNPay return (trình duyệt redirect về – nếu dùng VNPay)
router.get("/vnpay/return", vnpayReturn);

export default router;
