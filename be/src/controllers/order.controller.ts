// src/controllers/order.controller.ts
import { Response, Request } from "express";
import mongoose from "mongoose";
import OrderModel from "../models/order.model";
import OrderItemModel from "../models/order_item.model";
// Nếu bạn đã có AuthRequest trong middlewares/auth thì dùng dòng dưới:
// import { AuthRequest } from "../middlewares/auth";

/**
 * Helper: lấy userId từ nhiều kiểu middleware khác nhau.
 * Hỗ trợ:
 *  - req.user.id       (đề xuất)
 *  - req.user._id
 *  - req.userId
 *  - req.user_id
 */
function getUserId(req: Request & { user?: any; userId?: any; user_id?: any }): string | null {
  if (req.user?.id) return String(req.user.id);
  if (req.user?._id) return String(req.user._id);
  if (req.userId) return String(req.userId);
  if (req.user_id) return String(req.user_id);
  return null;
}

type CreateOrderItemInput = {
  productId: string;
  productType: "Course" | "Book";
  productPrice: number;
  quantity: number;
};

/**
 * POST /api/orders
 * Tạo đơn hàng (case không qua cổng thanh toán).
 * Body:
 * {
 *   payment_method: string;   // "bank" | "cod" | ...
 *   items: Array<{ productId, productType, productPrice, quantity }>
 * }
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const uid = getUserId(req);
    if (!uid) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const { payment_method, items } = req.body as {
      payment_method?: string;
      items?: CreateOrderItemInput[];
    };

    if (!payment_method) {
      return res.status(400).json({ message: "Thiếu payment_method" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Thiếu items" });
    }

    // Tính tổng tiền từ items
    const totalAmount = items.reduce((sum, it) => {
      const price = Number(it.productPrice || 0);
      const qty = Math.max(1, Number(it.quantity || 1));
      return sum + price * qty;
    }, 0);

    // Tạo order
    const order = await OrderModel.create({
      user_id: new mongoose.Types.ObjectId(uid),
      total_amount: totalAmount,
      status: "pending",
      payment_method,
    });

    // Lưu order items
    await OrderItemModel.insertMany(
      items.map((it) => ({
        order_id: order._id,
        product_id: new mongoose.Types.ObjectId(it.productId),
        product_type: it.productType,
        price_at_purchase: Number(it.productPrice),
        quantity: Math.max(1, Number(it.quantity)),
      }))
    );

    return res.status(201).json({
      message: "Order created successfully",
      orderId: order._id,
      total_amount: totalAmount,
      status: order.status,
      payment_method,
    });
  } catch (error: any) {
    console.error("createOrder error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * GET /api/orders/my-orders
 * Lấy danh sách đơn hàng của người dùng hiện tại.
 */
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const uid = getUserId(req);
    if (!uid) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const orders = await OrderModel.find({
      user_id: new mongoose.Types.ObjectId(uid),
    })
      // chú ý: schema dùng { timestamps: { createdAt: "created_at" } }
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json(orders);
  } catch (error: any) {
    console.error("getMyOrders error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export default {
  createOrder,
  getMyOrders,
};
