// src/api/voucherApi.ts
import axios from "./axios";

export type VoucherApplyItem = {
    id: string;
    type: "book" | "course";
    price: number;
    quantity: number;
};

export type VoucherAppliedData = {
    discount: number;
    finalTotal: number;
    subtotal: number;
    voucher: {
        code: string;
        type: "amount" | "percent";
        value: number;
        applyTo: "book" | "course" | "both";
    };
};

export type ApplyVoucherResponse = {
    success: boolean;
    message?: string;
    data?: VoucherAppliedData;
};

// export type CreateVoucherPayload = {
//     code: string;
//     type: "amount" | "percent";
//     value: number;
//     applyTo?: "book" | "course" | "both";
//     minOrderAmount?: number | null;
//     maxDiscountAmount?: number | null;
//     totalUsageLimit?: number | null;
//     startAt: string | Date;
//     endAt: string | Date;
// };
export type VoucherType = "amount" | "percent";
export type VoucherApplyTo = "book" | "course" | "both";

export interface VoucherDto {
    _id: string;
    code: string;
    type: VoucherType;
    value: number;
    applyTo: VoucherApplyTo;
    minOrderAmount: number | null;
    maxDiscountAmount: number | null;
    totalUsageLimit: number | null;
    usedCount: number;
    isActive: boolean;
    startAt: string;
    endAt: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateVoucherPayload {
    code: string;
    type: VoucherType;
    value: number;
    applyTo: VoucherApplyTo;
    minOrderAmount?: number | null;
    maxDiscountAmount?: number | null;
    totalUsageLimit?: number | null;
    startAt: string; // ISO
    endAt: string;   // ISO
}

export interface UpdateVoucherPayload extends Partial<CreateVoucherPayload> {
    isActive?: boolean;
}


const voucherApi = {
    // Áp dụng voucher cho giỏ hàng
    apply: (payload: { code: string; items: VoucherApplyItem[] }) : Promise<ApplyVoucherResponse> =>
        axios.post(`/vouchers/apply`, payload),

    // (optional) chi tiết 1 voucher
    getByCode: (code: string) => axios.get(`/vouchers/${code}`),

    getAll: (params?: any): Promise<VoucherDto[]> =>
        axios.get(`/vouchers`, { params }).then((res) => res.data.data ?? res.data),

    // POST /api/vouchers
    create: (payload: CreateVoucherPayload): Promise<VoucherDto> =>
        axios.post(`/vouchers`, payload).then((res) => res.data.data ?? res.data),

    // PATCH /api/vouchers/:id
    update: (id: string, payload: UpdateVoucherPayload): Promise<VoucherDto> =>
        axios
            .patch(`/vouchers/${id}`, payload)
            .then((res) => res.data.data ?? res.data),

    // DELETE /api/vouchers/:id
    delete: (id: string) => axios.delete(`/vouchers/${id}`),
};

export default voucherApi;
