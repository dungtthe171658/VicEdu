// src/types/user.d.ts

export type UserRole = 'admin' | 'teacher' | 'customer';

export interface UserDto {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  lockedUntil?: string | null; // Date object từ BE, string ở FE
  deletedAt?: string | null; // Cho soft delete
  
  created_at?: string;
  updated_at?: string;
}