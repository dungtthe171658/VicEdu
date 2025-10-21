// src/api/paymentsApi.ts
import axios from "./axios";
import type {
  CreatePaymentLinkPayload,
  CreatePaymentLinkResponse,
} from "../types/payment.d";

const paymentsApi = {
  /**
   * POST /api/payments/create-payment-link
   * Trả về { checkoutUrl, mock? }
   * Lưu ý: do bạn đã "unwrap" response.data trong setupAxios,
   * hàm này trả thẳng CreatePaymentLinkResponse (không phải AxiosResponse).
   */
  createPaymentLink(payload: CreatePaymentLinkPayload) {
    return axios.post<CreatePaymentLinkResponse>("/payments/create-payment-link", payload);
  },
};

export default paymentsApi;
