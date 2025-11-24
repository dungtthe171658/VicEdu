import { Request, Response } from "express";
import Voucher from "../models/voucher.model";
import { applyVoucher } from "../utils/voucher";

interface MongoError extends Error {
  code?: number;
}

export const createVoucher = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      code,
      type,
      value,
      applyTo,
      minOrderAmount,
      maxDiscountAmount,
      totalUsageLimit,
      startAt,
      endAt,
    } = req.body;

    if (!code || !type || value == null || !startAt || !endAt) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu bắt buộc (code, type, value, startAt, endAt)",
      });
    }

    const voucher = await Voucher.create({
      code: String(code).toUpperCase(),
      type,
      value,
      applyTo: applyTo || "both",
      minOrderAmount: minOrderAmount ?? null,
      maxDiscountAmount: maxDiscountAmount ?? null,
      totalUsageLimit: totalUsageLimit ?? null,
      usedCount: 0,
      isActive: true,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
    });

    return res.json({ success: true, data: voucher });
  } catch (error) {
    console.error(error);
    const e = error as MongoError;

    if (e.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Mã voucher đã tồn tại" });
    }

    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi tạo voucher" });
  }
};

export const applyVoucherController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { code, items } = req.body;

    if (!code || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu (code, items)",
      });
    }

    const now = new Date();
    const codeUpper = String(code).trim().toUpperCase();

    const voucher = await Voucher.findOne({ code: codeUpper });

    if (!voucher || !voucher.isActive) {
      return res.status(400).json({
        success: false,
        message: "Voucher không tồn tại hoặc đã bị khóa",
      });
    }

    if (voucher.startAt && now < voucher.startAt) {
      return res.status(400).json({
        success: false,
        message: "Voucher chưa đến thời gian sử dụng",
      });
    }

    if (voucher.endAt && now > voucher.endAt) {
      return res.status(400).json({
        success: false,
        message: "Voucher đã hết hạn",
      });
    }

    if (
      voucher.totalUsageLimit !== null &&
      typeof voucher.totalUsageLimit === "number" &&
      voucher.usedCount >= voucher.totalUsageLimit
    ) {
      return res.status(400).json({
        success: false,
        message: "Voucher đã dùng hết lượt",
      });
    }

    const result = applyVoucher(voucher.toObject(), items);

    if (!result.ok) {
      return res
        .status(400)
        .json({ success: false, message: result.message });
    }

    return res.json({
      success: true,
      data: {
        discount: result.discount,
        finalTotal: result.finalTotal,
        subtotal: result.subtotalAll,
        voucher: {
          code: voucher.code,
          type: voucher.type,
          value: voucher.value,
          applyTo: voucher.applyTo,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi áp dụng voucher" });
  }
};

export const listVouchers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: vouchers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách",
    });
  }
};
