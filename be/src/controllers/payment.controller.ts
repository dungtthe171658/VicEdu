// src/controllers/payment.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import OrderModel from "../models/order.model";
import OrderItemModel from "../models/order_item.model";
import EnrollmentModel from "../models/enrollment.model";
import type { Webhook } from "@payos/node";
// ==============================
// 1) PayOS SDK v2 – an toàn, có fallback
// ==============================
import { PayOS } from "@payos/node";

// Đảm bảo ENV
const FE_URL = process.env.FE_URL || "http://localhost:3000";
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || "";
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || "";
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || "";

// Bật PayOS thật khi đủ ENV
const PAYOS_ENABLED =
  !!PAYOS_CLIENT_ID && !!PAYOS_API_KEY && !!PAYOS_CHECKSUM_KEY;

// SDK thật hoặc mock
const payos = PAYOS_ENABLED
  ? new PayOS({
      clientId: PAYOS_CLIENT_ID,
      apiKey: PAYOS_API_KEY,
      checksumKey: PAYOS_CHECKSUM_KEY,
    })
  : // Mock nhẹ để bạn test luồng không lỗi nếu thiếu ENV
    ({
      paymentRequests: {
        async create({ orderCode, amount, description, returnUrl, cancelUrl }: any) {
          console.warn(
            "[PAYOS MOCK] paymentRequests.create – thiếu ENV, trả về mock checkoutUrl"
          );
          const url = new URL(returnUrl || `${FE_URL}/payment-success`);
          url.searchParams.set("mock", "1");
          url.searchParams.set("orderCode", String(orderCode || Date.now()));
          url.searchParams.set("amount", String(amount || 0));
          return { checkoutUrl: url.toString(), description, cancelUrl };
        },
      },
      webhooks: {
        async verify(body: any) {
          console.warn("[PAYOS MOCK] webhooks.verify – trả raw body");
          // Trả về “payload phẳng” giống PayOS v2 sau verify
          return {
            ...(typeof body === "object" ? body : {}),
            orderCode:
              body?.orderCode ??
              body?.data?.orderCode ??
              Number(new Date().getTime()),
            transactionId: body?.transactionId ?? body?.data?.transactionId ?? "txn_mock",
          };
        },
      },
    } as unknown as PayOS);

// ==============================
// 2) Helpers
// ==============================
function getUserId(req: Request & { user?: any; user_id?: any; userId?: any }): string | null {
  if (req.user?.id) return String(req.user.id);
  if (req.user?._id) return String(req.user._id);
  if (req.user_id) return String(req.user_id);
  if (req.userId) return String(req.userId);
  return null;
}

function toObjectId(id: string) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
}

// Giới hạn mô tả ≤ 25 ký tự, ASCII an toàn theo yêu cầu PayOS/VNPay
function buildPayOSDescription(input: string, limit = 25) {
  const ascii = (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")          // bỏ dấu tiếng Việt
    .replace(/[^a-zA-Z0-9\s#\-_.]/g, "")      // chỉ giữ ký tự an toàn
    .trim();
  const desc = ascii || "Thanh toan";
  return desc.length > limit ? desc.slice(0, limit) : desc;
}

// ==============================
// 3) Tạo link thanh toán
//    POST /api/payments/create-payment-link
// ==============================
export const createPaymentLink = async (req: Request, res: Response) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ message: "Unauthenticated" });

    const { location, phone, items } = req.body as {
      location: string;
      phone: string;
      items: {
        productId: string;
        productType?: "Course" | "Book";
        productName?: string;
        productPrice: number;
        quantity: number;
      }[];
    };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Thiếu items" });
    }

    const totalAmount = items.reduce(
      (s, it) => s + Number(it.productPrice || 0) * Number(it.quantity || 1),
      0
    );
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ message: "Tổng tiền không hợp lệ" });
    }

    // 1) Tạo order pending
    const order_code = Date.now(); // unique number
    const userObjectId = toObjectId(uid);
    if (!userObjectId) {
      return res.status(400).json({ message: "userId không hợp lệ" });
    }

    const order = await OrderModel.create({
      user_id: userObjectId,
      total_amount: totalAmount,
      payment_method: "payos",
      status: "pending",
      order_code,
      meta: { location, phone },
    });

    // 2) Lưu order items
    const orderItems = items.map((it) => {
      const pid = toObjectId(it.productId);
      if (!pid) throw new Error(`productId không hợp lệ: ${it.productId}`);
      return {
        order_id: order._id,
        product_id: pid,
        product_type: it.productType ?? "Course",
        price_at_purchase: Number(it.productPrice),
        quantity: Number(it.quantity || 1),
      };
    });
    await OrderItemModel.insertMany(orderItems);

    // 3) Gọi PayOS (thật hoặc mock) tạo link thanh toán
    //    Dùng mô tả ngắn gọn để đảm bảo ≤ 25 ký tự
    const rawDesc = `DH#${order_code}`; // ví dụ: "DH#1761062941393"
    const description = buildPayOSDescription(rawDesc, 25);

    const payment = await payos.paymentRequests.create({
      orderCode: order_code,
      amount: Number(totalAmount),
      description, // ✅ luôn ≤ 25 ký tự, ASCII
      returnUrl: `${FE_URL}/payment-success?orderId=${order._id}`,
      cancelUrl: `${FE_URL}/payment-cancel?orderId=${order._id}`,
    });

    if (!payment?.checkoutUrl) {
      throw new Error("Không nhận được checkoutUrl từ PayOS");
    }

    return res.json({
      checkoutUrl: payment.checkoutUrl,
      mock: !PAYOS_ENABLED ? true : undefined,
    });
  } catch (error: any) {
    console.error(
      "createPaymentLink error:",
      error?.response?.data || error?.message || error
    );
    return res
      .status(500)
      .json({ message: "Lỗi tạo link thanh toán", error: error?.message });
  }
};

export const payosWebhook = async (req: Request, res: Response) => {
  try {
    // Nếu route webhook dùng express.raw(), có thể req.body là Buffer
    const raw = (req as any).rawBody ?? req.body;

    // Đảm bảo có object để verify
    const payload: Webhook =
      Buffer.isBuffer(raw)
        ? (JSON.parse(raw.toString("utf8")) as Webhook)
        : (raw as Webhook);

    // ✅ Truyền đúng kiểu Webhook cho SDK
    const verified = await payos.webhooks.verify(payload);

    // 👉 verified là dữ liệu phẳng theo SDK v2
    const orderCode = (verified as any)?.orderCode;
    const gatewayTxnId = (verified as any)?.transactionId || (verified as any)?.id;

    if (!orderCode) {
      return res.status(400).json({ message: "Thiếu orderCode" });
    }

    const order = await OrderModel.findOne({ order_code: Number(orderCode) });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "completed") {
      order.status = "completed";
      order.paid_at = new Date();
      order.gateway_txn_id = gatewayTxnId;
      order.meta = { ...(order.meta || {}), payos: verified };
      await order.save();

      const items = await OrderItemModel.find({ order_id: order._id, product_type: "Course" });
      for (const it of items) {
        const existed = await EnrollmentModel.exists({
          user_id: order.user_id,
          course_id: it.product_id,
        });
        if (!existed) {
          await EnrollmentModel.create({ user_id: order.user_id, course_id: it.product_id });
        }
      }
    }

    return res.json({ ok: true });
  } catch (error: any) {
    console.error("payosWebhook error:", error?.response?.data || error?.message || error);
    return res.status(500).json({ message: "Webhook error", error: error?.message });
  }
};

// ==============================
// 5) VNPAY return – giữ nguyên
//    GET /api/payments/vnpay/return
// ==============================
export const vnpayReturn = async (req: Request, res: Response) => {
  try {
    return res.redirect(
      `${FE_URL}/payment-result?orderId=${req.query?.vnp_TxnRef || ""}`
    );
  } catch (error: any) {
    return res.status(500).json({ message: error?.message });
  }
};
