// src/controllers/payment.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import OrderModel from "../models/order.model";
import OrderItemModel from "../models/order_item.model";
import EnrollmentModel from "../models/enrollment.model";
import BookHistoryModel from "../models/bookHistory.model";
import type { Webhook } from "@payos/node";
import { PayOS } from "@payos/node";

/* ==============================
   0) ENV & SDK
   ============================== */
const FE_URL = process.env.FE_URL || "http://localhost:5173";
const API_URL = process.env.API_URL || "http://localhost:8888";
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || "";
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || "";
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || "";

if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
  throw new Error(
    "[PayOS] Missing env. Set PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY"
  );
}

const payos = new PayOS({
  clientId: PAYOS_CLIENT_ID,
  apiKey: PAYOS_API_KEY,
  checksumKey: PAYOS_CHECKSUM_KEY,
});

/* ==============================
   1) Helpers
   ============================== */
function getUserId(
  req: Request & { user?: any; user_id?: any; userId?: any }
): string | null {
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

function buildPayOSDescription(input: string, limit = 25) {
  const ascii = (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s#\-_.]/g, "")
    .trim();
  const desc = ascii || "Thanh toan";
  return desc.length > limit ? desc.slice(0, limit) : desc;
}

function sign(orderCode: number, ts: number) {
  return crypto
    .createHmac("sha256", PAYOS_CHECKSUM_KEY)
    .update(`${orderCode}.${ts}`)
    .digest("hex");
}

function verifySig(orderCode: number, ts: number, sig: string) {
  const expect = crypto
    .createHmac("sha256", PAYOS_CHECKSUM_KEY)
    .update(`${orderCode}.${ts}`)
    .digest("hex");
  const expired = Date.now() - Number(ts) > 48 * 60 * 60 * 1000; // 48h
  return !expired && sig === expect;
}

/* ==============================
   2) Tạo link thanh toán (PayOS)
   POST /api/payments/create-payment-link
   ============================== */
export const createPaymentLink = async (req: Request, res: Response) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ message: "Unauthenticated" });

    const {
      location,
      phone,
      fullName,
      items,
      email: emailFromClient,
    } = req.body as {
      location: string;
      phone: string;
      fullName?: string;
      email?: string;
      items: {
        productId: string;
        productType?: "Course" | "Book";
        productName?: string;
        productPrice: number;
        quantity: number;
      }[];
    };

    const emailFromToken = (req as any)?.user?.email as
      | string
      | undefined;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Thiếu items" });
    }

    const totalAmount = items.reduce(
      (sum, it) =>
        sum +
        Number(it.productPrice || 0) * Number(it.quantity || 1),
      0
    );
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Tổng tiền không hợp lệ" });
    }

    const order_code = Date.now();
    const userObjectId = toObjectId(uid);
    if (!userObjectId) {
      return res
        .status(400)
        .json({ message: "userId không hợp lệ" });
    }

    const order = await OrderModel.create({
      user_id: userObjectId,
      total_amount: totalAmount,
      payment_method: "payos",
      status: "failed",
      order_code,
      meta: {
        location,
        phone,
        fullName,
        email: emailFromToken || emailFromClient,
      },
    });

    const orderItems = items.map((it) => {
      const pid = toObjectId(it.productId);
      if (!pid) {
        throw new Error(
          `productId không hợp lệ: ${it.productId}`
        );
      }

      return {
        order_id: order._id,
        product_id: pid,
        product_type: it.productType ?? "Course",
        price_at_purchase: Number(it.productPrice),
        quantity: Number(it.quantity || 1),
      };
    });

    await OrderItemModel.insertMany(orderItems);

    // Upsert Enrollment "pending" cho các course
    const orderId = order._id as mongoose.Types.ObjectId;
    const courseIds = Array.from(
      new Set(
        orderItems
          .filter((i) => i.product_type === "Course")
          .map((i) => String(i.product_id))
      )
    ).map((id) => new mongoose.Types.ObjectId(id));

    await Promise.all(
      courseIds.map((cid) =>
        EnrollmentModel.updateOne(
          { user_id: userObjectId, course_id: cid },
          {
            $setOnInsert: {
              progress: 0,
              completed_lessons: [],
              status: "pending",
              order_id: orderId,
              activated_at: null,
            },
          },
          { upsert: true }
        ).catch((e: any) => {
          if (e?.code !== 11000) throw e;
        })
      )
    );

    const ts = Date.now();
    const sig = sign(order_code, ts);
    const description = buildPayOSDescription(
      `DH#${order_code}`,
      25
    );

    const payment = await payos.paymentRequests.create({
      orderCode: order_code,
      amount: Number(totalAmount),
      description,
      returnUrl: `${API_URL}/api/payments/payos/return?orderId=${order._id}&orderCode=${order_code}&ts=${ts}&sig=${sig}`,
      cancelUrl: `${API_URL}/api/payments/payos/cancel?orderId=${order._id}&orderCode=${order_code}&ts=${ts}&sig=${sig}`,
    });

    if (!payment?.checkoutUrl) {
      throw new Error(
        "Không nhận được checkoutUrl từ PayOS"
      );
    }

    return res.json({ checkoutUrl: payment.checkoutUrl });
  } catch (error: any) {
    console.error(
      "createPaymentLink error:",
      error?.response?.data || error?.message || error
    );
    return res.status(500).json({
      message: "Lỗi tạo link thanh toán",
      error: error?.message,
    });
  }
};

/* ==============================
   3) Redirect SUCCESS từ PayOS
   GET /api/payments/payos/return
   ============================== */
export const payosReturnHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { orderId, orderCode, ts, sig } = req.query as any;

    const feTarget =
      `${FE_URL}/payment-success` +
      (orderId && orderCode
        ? `?orderId=${encodeURIComponent(
            String(orderId)
          )}&orderCode=${encodeURIComponent(String(orderCode))}`
        : "");
    res.redirect(303, feTarget);

    if (!orderCode || !ts || !sig) return;
    if (!verifySig(Number(orderCode), Number(ts), String(sig))) {
      console.warn("[return] bad sig/expired", {
        orderCode,
        ts,
      });
      return;
    }

    const filter: any = { order_code: Number(orderCode) };
    if (orderId && mongoose.isValidObjectId(orderId)) {
      filter._id = new mongoose.Types.ObjectId(String(orderId));
    }

    await OrderModel.updateOne(
      { ...filter, status: { $ne: "completed" } },
      {
        $set: {
          status: "pending",
          "meta.pending_set_at": new Date(),
          "meta.from": "returnUrl",
        },
      }
    );

    const order = await OrderModel.findOne(filter).lean();
    if (!order) return;

    const orderObjectId = order._id as mongoose.Types.ObjectId;
    const userId = order.user_id as mongoose.Types.ObjectId;

    // Xử lý Course enrollments
    const courseItems = await OrderItemModel.find({
      order_id: orderObjectId,
      product_type: "Course",
    }).lean();

    if (courseItems.length) {
      await Promise.all(
        courseItems.map((it) =>
          EnrollmentModel.updateOne(
            {
              user_id: userId,
              course_id:
                it.product_id as mongoose.Types.ObjectId,
            },
            {
              $set: {
                status: "active",
                activated_at: new Date(),
                order_id: orderObjectId,
              },
              $setOnInsert: {
                progress: 0,
                completed_lessons: [],
              },
            },
            { upsert: true }
          )
        )
      );

      await OrderModel.updateOne(
        { _id: orderObjectId },
        {
          $set: {
            "meta.activation_source": "returnUrl",
            "meta.activation_at": new Date(),
          },
        }
      );
    }

    // Xử lý Book history - Lưu sách vào bookHistory sau khi thanh toán thành công
    const bookItems = await OrderItemModel.find({
      order_id: orderObjectId,
      product_type: "Book",
    }).lean();

    if (bookItems.length) {
      console.log(`[payosReturnHandler] Lưu ${bookItems.length} sách vào bookHistory cho order ${orderObjectId}`);
      await Promise.all(
        bookItems.map(async (it) => {
          try {
            const result = await BookHistoryModel.updateOne(
              {
                user_id: userId,
                book_id: it.product_id as mongoose.Types.ObjectId,
              },
              {
                $set: {
                  order_id: orderObjectId,
                  price_at_purchase: it.price_at_purchase,
                  purchased_at: new Date(),
                  status: "active",
                },
              },
              { upsert: true }
            );
            console.log(`[payosReturnHandler] Đã lưu book ${it.product_id} vào bookHistory:`, result.upsertedCount > 0 ? 'created' : 'updated');
          } catch (e: any) {
            if (e?.code !== 11000) {
              console.error(`[payosReturnHandler] Lỗi khi lưu book ${it.product_id} vào bookHistory:`, e?.message || e);
              throw e;
            }
          }
        })
      );
    }
  } catch (e: any) {
    console.error("payosReturnHandler fatal:", e?.message || e);
  }
};

/* ==============================
   4) Redirect CANCEL từ PayOS
   GET /api/payments/payos/cancel
   ============================== */
export const payosCancelHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { orderId, orderCode, ts, sig } = req.query as any;

    const feTarget =
      `${FE_URL}/payment-cancel` +
      (orderId && orderCode
        ? `?orderId=${encodeURIComponent(
            String(orderId)
          )}&orderCode=${encodeURIComponent(String(orderCode))}`
        : "");
    res.redirect(303, feTarget);

    if (!orderCode || !ts || !sig) return;
    if (!verifySig(Number(orderCode), Number(ts), String(sig))) {
      console.warn("[cancel] bad sig/expired", {
        orderCode,
        ts,
      });
      return;
    }

    const filter: any = { order_code: Number(orderCode) };
    if (orderId && mongoose.isValidObjectId(orderId)) {
      filter._id = new mongoose.Types.ObjectId(String(orderId));
    }

    await OrderModel.updateOne(
      { ...filter, status: { $ne: "completed" } },
      {
        $set: {
          status: "cancelled",
          "meta.cancelled_at": new Date(),
          "meta.from": "cancelUrl",
        },
      }
    );
  } catch (e: any) {
    console.error("payosCancelHandler fatal:", e?.message || e);
  }
};

/* ==============================
   5) Webhook PayOS
   POST /api/payments/payos/webhook
   ============================== */
export const payosWebhook = async (req: Request, res: Response) => {
  try {
    const raw = (req as any).rawBody ?? req.body;
    const payload: Webhook = Buffer.isBuffer(raw)
      ? (JSON.parse(raw.toString("utf8")) as Webhook)
      : (raw as Webhook);

    const verified = await payos.webhooks.verify(payload);
    const orderCode = (verified as any)?.orderCode;
    const gatewayTxnId =
      (verified as any)?.transactionId ||
      (verified as any)?.id;

    if (!orderCode) {
      return res
        .status(400)
        .json({ message: "Thiếu orderCode" });
    }

    const order = await OrderModel.findOne({
      order_code: Number(orderCode),
    });
    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found" });
    }

    const orderId = order._id as mongoose.Types.ObjectId;

    if (order.status !== "completed") {
      order.status = "completed";
      order.paid_at = new Date();
      order.gateway_txn_id = gatewayTxnId;
      order.meta = { ...(order.meta || {}), payos: verified };
      await order.save();

      const userId = order.user_id as mongoose.Types.ObjectId;

      // Xử lý Course enrollments
      const courseItems = await OrderItemModel.find({
        order_id: orderId,
        product_type: "Course",
      }).lean();

      await Promise.all(
        courseItems.map((it) =>
          EnrollmentModel.updateOne(
            {
              user_id: userId,
              course_id:
                it.product_id as mongoose.Types.ObjectId,
            },
            {
              $set: {
                status: "active",
                activated_at: order.paid_at,
                order_id: orderId,
              },
              $setOnInsert: {
                progress: 0,
                completed_lessons: [],
              },
            },
            { upsert: true }
          )
        )
      );

      // Xử lý Book history - Lưu sách vào bookHistory sau khi thanh toán thành công
      const bookItems = await OrderItemModel.find({
        order_id: orderId,
        product_type: "Book",
      }).lean();

      if (bookItems.length) {
        console.log(`[payosWebhook] Lưu ${bookItems.length} sách vào bookHistory cho order ${orderId}`);
        await Promise.all(
          bookItems.map(async (it) => {
            try {
              const result = await BookHistoryModel.updateOne(
                {
                  user_id: userId,
                  book_id: it.product_id as mongoose.Types.ObjectId,
                },
                {
                  $set: {
                    order_id: orderId,
                    price_at_purchase: it.price_at_purchase,
                    purchased_at: order.paid_at,
                    status: "active",
                  },
                },
                { upsert: true }
              );
              console.log(`[payosWebhook] Đã lưu book ${it.product_id} vào bookHistory:`, result.upsertedCount > 0 ? 'created' : 'updated');
            } catch (e: any) {
              if (e?.code !== 11000) {
                console.error(`[payosWebhook] Lỗi khi lưu book ${it.product_id} vào bookHistory:`, e?.message || e);
                throw e;
              }
            }
          })
        );
      }
    }

    return res.json({ ok: true });
  } catch (error: any) {
    console.error(
      "payosWebhook error:",
      error?.response?.data || error?.message || error
    );
    return res.status(500).json({
      message: "Webhook error",
      error: error?.message,
    });
  }
};

/* ==============================
   6) Hủy thanh toán thủ công
   POST /api/payments/cancel
   ============================== */
export const cancelPayment = async (req: Request, res: Response) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ message: "Unauthenticated" });

    const { orderId, orderCode } = req.body as {
      orderId?: string;
      orderCode?: number | string;
    };

    const filter: any = {
      user_id: new mongoose.Types.ObjectId(uid),
    };
    if (orderId && mongoose.isValidObjectId(orderId)) {
      filter._id = new mongoose.Types.ObjectId(orderId);
    }
    if (orderCode) {
      filter.order_code = Number(orderCode);
    }

    const order = await OrderModel.findOne(filter);
    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found" });
    }
    if (order.status === "completed") {
      return res
        .status(409)
        .json({ message: "Order already paid" });
    }

    order.status = "cancelled";
    order.meta = {
      ...(order.meta || {}),
      cancel_reason: "user_cancelled",
      cancelled_at: new Date(),
    };
    await order.save();

    return res.json({ ok: true });
  } catch (e: any) {
    console.error("cancelPayment error:", e?.message || e);
    return res
      .status(500)
      .json({ message: e?.message || "Cancel error" });
  }
};

/* ==============================
   7) VNPay return (nếu dùng)
   GET /api/payments/vnpay/return
   ============================== */
export const vnpayReturn = async (
  req: Request,
  res: Response
) => {
  try {
    return res.redirect(
      `${FE_URL}/payment-result?orderId=${
        (req.query as any)?.vnp_TxnRef || ""
      }`
    );
  } catch (error: any) {
    return res.status(500).json({ message: error?.message });
  }
};

/* ==============================
   8) Kích hoạt enrollment idempotent từ FE
   POST /api/payments/activate
   body: { orderId: string, orderCode?: number }
   ============================== */
export const activateOrderCourses = async (
  req: Request,
  res: Response
) => {
  try {
    const uid =
      (req as any).user?._id || (req as any).user?.id;
    if (!uid) {
      return res.status(401).json({
        message: "Unauthenticated",
      });
    }

    const { orderId, orderCode } = req.body as {
      orderId: string;
      orderCode?: number | string;
    };
    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return res
        .status(400)
        .json({ message: "orderId không hợp lệ" });
    }

    const filter: any = {
      _id: new mongoose.Types.ObjectId(orderId),
      user_id: new mongoose.Types.ObjectId(uid),
    };
    if (orderCode) {
      filter.order_code = Number(orderCode);
    }

    const order = await OrderModel.findOne(filter);
    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found" });
    }

    const courseItems = await OrderItemModel.find({
      order_id: order._id,
      product_type: "Course",
    }).lean();

    await Promise.all(
      courseItems.map((it) =>
        EnrollmentModel.updateOne(
          {
            user_id:
              order.user_id as mongoose.Types.ObjectId,
            course_id:
              it.product_id as mongoose.Types.ObjectId,
          },
          {
            $set: {
              status: "active",
              activated_at: new Date(),
              order_id:
                order._id as mongoose.Types.ObjectId,
            },
            $setOnInsert: {
              progress: 0,
              completed_lessons: [],
            },
          },
          { upsert: true }
        )
      )
    );

    await OrderModel.updateOne(
      { _id: order._id },
      {
        $set: {
          "meta.activation_source": "fe_activation",
          "meta.activation_at": new Date(),
        },
      }
    );

    return res.json({ ok: true });
  } catch (e: any) {
    console.error(
      "activateOrderCourses error:",
      e?.message || e
    );
    return res
      .status(500)
      .json({ message: e?.message || "Activate error" });
  }
};

