// src/types/order.d.ts
import type { UserDto } from './user.d';

export type ProductType = 'Course' | 'Book';
export type OrderStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface OrderItemDto {
  _id: string;
  order_id: string;
  product_id: string; // ID của sản phẩm (Course/Book)
  product_type: ProductType;
  price_at_purchase: number;
  quantity: number;
  // Có thể thêm tên sản phẩm nếu Backend populate
  product_name?: string; 
}

export interface OrderDto {
  _id: string;
  total_amount: number;
  status: OrderStatus;
  payment_method?: string;
  created_at?: string;

  // Cho phép ID hoặc object được populate
  user_id: string | UserDto; 
  
  // Nếu muốn hiển thị danh sách items ngay trong order:
  items?: OrderItemDto[]; 
}