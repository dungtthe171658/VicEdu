// src/types/book.d.ts
import type { Category } from "./category.d";

export interface BookDto {
  _id: string; // luôn có nếu lấy từ DB
  title: string;
  slug?: string;
  author?: string;
  description?: string;
  price_cents: number;
  stock?: number;
  category_id: string | Category;
  is_published?: boolean;
  images?: string[];
  created_at?: string;
  updated_at?: string;
}
