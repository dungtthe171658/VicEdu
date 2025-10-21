import express from "express";
import { createOrder, getMyOrders, getAllOrders  } from "../controllers/order.controller";
import { authenticateToken } from "../middlewares/auth";

const router = express.Router();
router.use(authenticateToken);

router.post("/", createOrder);
router.get("/my-orders", getMyOrders);
router.get("/", getAllOrders);

export default router;