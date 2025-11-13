import express from "express";
import { createOrder, getMyOrders, getAllOrders, getOrderItems  } from "../controllers/order.controller";
import { authenticateToken } from "../middlewares/auth";

const router = express.Router();
router.use(authenticateToken);

router.post("/", createOrder);
router.get("/my-orders", getMyOrders);
router.get("/", getAllOrders);
router.get("/:id/items", getOrderItems);

export default router;