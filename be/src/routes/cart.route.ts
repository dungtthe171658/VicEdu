import express from "express";
import {
  getMyCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from "../controllers/cart.controller";
import { authenticateToken } from "../middlewares/auth";

const router = express.Router();

// Require authentication for all cart routes
router.use(authenticateToken);

router.get("/", getMyCart);
router.post("/items", addItemToCart);
router.patch("/items", updateCartItemQuantity);
router.delete("/items", removeCartItem);
router.delete("/", clearCart);

export default router;

