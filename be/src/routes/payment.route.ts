import express from "express";
import { handlePaymentCallback } from "../controllers/payment.controller";

const router = express.Router();
router.get("/vnpay_return", handlePaymentCallback);

export default router;