import React, { createContext, useState, useEffect, useMemo, ReactNode } from 'react';
// Giả sử bạn có các hàm gọi API được định nghĩa riêng
import { loginApi, verifyTokenApi } from '../api/authApi';

// 1. Định nghĩa kiểu dữ liệu cho User và giá trị của Context
interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'teacher'; // Mở rộng thêm các role khác nếu cần
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// 2. Tạo Context với giá trị mặc định
// Giá trị mặc định này chỉ được dùng khi một component cố gắng truy cập context bên ngoài Provider
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Tạo Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Ban đầu là true để kiểm tra token

  // useEffect này chạy một lần duy nhất khi app khởi động
  // Nhiệm vụ của nó là kiểm tra xem có token trong localStorage không
  useEffect(() => {
    const checkUserStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Gửi token lên server để xác thực
          const userData = await verifyTokenApi(token);
          setUser(userData);
        } catch (error) {
          // Token không hợp lệ -> xóa token và logout
          console.error("Token verification failed", error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setIsLoading(false); // Hoàn tất kiểm tra, không còn loading nữa
    };

    checkUserStatus();
  }, []);

  // Hàm để xử lý đăng nhập
  const login = async (email: string, password: string) => {
    try {
      const { user: userData, token } = await loginApi(email, password);
      localStorage.setItem('token', token);
      setUser(userData);
    } catch (error) {
      console.error("Login failed", error);
      // Ném lỗi ra ngoài để component Login có thể bắt và hiển thị thông báo
      throw error;
    }
  };

  // Hàm để xử lý đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // 4. Dùng useMemo để tối ưu, tránh re-render không cần thiết
  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};