// src/types/review.d.ts
import type { UserDto } from './user.d';

export type ReviewStatus = 'pending' | 'approved';

export interface ReviewDto {
  _id: string;
  product_id: string; // ID của Course hoặc Book
  product_type: 'Course' | 'Book';
  rating: number;
  comment?: string;
  status: ReviewStatus;
  created_at?: string;

  // Cho phép ID hoặc object được populate
  user_id: string | UserDto;
  
  // Tiêu đề của sản phẩm được review (cần populate từ BE)
  product_title?: string; 
}