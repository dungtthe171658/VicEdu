// src/utils/voucher.ts

export type ItemType = "book" | "course";

export interface CartItem {
  id: string;
  type: ItemType;   // 'book' | 'course'
  price: number;
  quantity: number;
}

// chỉ cần những field liên quan đến tính toán
export interface VoucherLike {
  code: string;
  type: "amount" | "percent";
  value: number;
  applyTo: "book" | "course" | "both";
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
}

export interface ApplyVoucherResult {
  ok: boolean;
  reason?: string;
  message?: string;
  discount?: number;
  finalTotal?: number;
  subtotalAll?: number;
}

export const applyVoucher = (
  voucher: VoucherLike,
  cartItems: CartItem[]
): ApplyVoucherResult => {
  let subtotalApplicable = 0;
  let subtotalAll = 0;

  for (const item of cartItems) {
    const itemTotal = item.price * item.quantity;
    subtotalAll += itemTotal;

    const isBook = item.type === "book";
    const isCourse = item.type === "course";

    let applicable = false;
    if (voucher.applyTo === "both") applicable = true;
    else if (voucher.applyTo === "book" && isBook) applicable = true;
    else if (voucher.applyTo === "course" && isCourse) applicable = true;

    if (applicable) {
      subtotalApplicable += itemTotal;
    }
  }

  // check đơn tối thiểu
  if (
    voucher.minOrderAmount != null && // khác null & undefined
    subtotalAll < voucher.minOrderAmount
  ) {
    return {
      ok: false,
      reason: "MIN_ORDER_NOT_REACHED",
      message: `Đơn hàng phải tối thiểu ${voucher.minOrderAmount}`,
    };
  }

  let discount = 0;

  if (voucher.type === "amount") {
    discount = voucher.value;
  } else if (voucher.type === "percent") {
    discount = (subtotalApplicable * voucher.value) / 100;

    if (
      voucher.maxDiscountAmount != null &&
      discount > voucher.maxDiscountAmount
    ) {
      discount = voucher.maxDiscountAmount;
    }
  }

  if (discount > subtotalAll) {
    discount = subtotalAll;
  }

  const finalTotal = subtotalAll - discount;

  return {
    ok: true,
    discount,
    finalTotal,
    subtotalAll,
  };
};
