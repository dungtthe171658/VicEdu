// src/api/cartApi.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8888/api";

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type CartProductType = "Course" | "Book";

export interface CartItemProduct {
  _id: string;
  title?: string;
  slug?: string;
  price?: number;
  thumbnail_url?: string;
  images?: string[];
}

export interface CartItemDto {
  product_id: string | CartItemProduct;
  product_type: CartProductType;
  price_at_added: number;
  quantity: number;
  added_at: string;
  product_snapshot?: CartItemProduct;
}

export interface CartDto {
  _id: string;
  user_id: string;
  items: CartItemDto[];
  total_amount: number;
  status: "active" | "abandoned" | "converted" | "expired";
  expires_at?: string;
  notes?: string;
}

const cartApi = {
  getMyCart: async (): Promise<CartDto> => {
    const res = await api.get("/cart");
    return res.data;
  },

  addItem: async (params: {
    productId: string;
    productType: CartProductType;
    quantity?: number;
  }): Promise<CartDto> => {
    const res = await api.post("/cart/items", params);
    return res.data;
  },

  updateItemQuantity: async (params: {
    productId: string;
    productType: CartProductType;
    quantity: number;
  }): Promise<CartDto> => {
    const res = await api.patch("/cart/items", params);
    return res.data;
  },

  removeItem: async (params: {
    productId: string;
    productType: CartProductType;
  }): Promise<CartDto> => {
    const res = await api.delete("/cart/items", { data: params });
    return res.data;
  },

  clear: async (): Promise<CartDto> => {
    const res = await api.delete("/cart");
    return res.data;
  },
};

export default cartApi;
