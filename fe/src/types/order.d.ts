import type { UserDto } from './user';
import type { Course } from "./course";
import type { OrderItem } from '../api/orderApi';

export type OrderStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface OrderDto {
  _id: string;
  total_amount: number;
  status: OrderStatus;
  payment_method?: string;
  created_at?: string;
  user_id: string | UserDto;

  // Dạng mới
  course: Course[];
  book: string[];
  
  // Order items với product_type
  order_items?: OrderItem[];
}