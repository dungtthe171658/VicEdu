// routes/payment.route.ts
import express from "express";
import { Router } from "express";
import {
  createPaymentLink,
  payosWebhook,
  payosReturnHandler,
  payosCancelHandler,
  vnpayReturn,
  cancelPayment,
  activateOrderCourses, // ⬅️ NEW
} from "../controllers/payment.controller";
import { authenticateToken as verifyToken } from "../middlewares/auth";

const router = Router();

// Public (PayOS gọi/redirect)
router.post("/payos/webhook", express.raw({ type: "application/json" }), payosWebhook);
router.get("/payos/return",  payosReturnHandler);
router.get("/payos/cancel",  payosCancelHandler);
router.get("/vnpay/return",  vnpayReturn);

// Protected (FE gọi)
router.post("/create-payment-link", verifyToken, createPaymentLink);
router.post("/cancel",              verifyToken, cancelPayment);
router.post("/activate",            verifyToken, activateOrderCourses); // ⬅️ NEW

export default router;
