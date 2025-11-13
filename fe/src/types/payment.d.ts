// src/types/payment.d.ts
export type ProductType = "Course" | "Book";

export interface PaymentItem {
  productId: string;
  productType: ProductType;
  productName?: string;
  productPrice: number;   // VND (đã là integer, không , .)
  quantity: number;
}

export interface CreatePaymentLinkPayload {
  location: string;       // địa chỉ nhận hàng / thông tin liên hệ
  phone: string;
  fullName?: string;
  email?: string;
  items: PaymentItem[];
}

export interface CreatePaymentLinkResponse {
  checkoutUrl: string;
  mock?: boolean;         // nếu BE đang mock PayOS
}
