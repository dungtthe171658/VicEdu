export type UserRole = 'admin' | 'teacher' | 'customer';

export interface UserDto {
  _id: string;
  name: string;               // ✅ trùng với BE
  email: string;
  phone?: string;
  avatar?: string;            // ✅ trùng với BE
  role: UserRole;
  is_verified: boolean;       // ✅ trùng với BE
  lockedUntil?: string | null;
  deletedAt?: string | null;
  
  createdAt?: string;
  updatedAt?: string;
}
