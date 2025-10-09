// src/routes/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth(); // Giả sử hook có trạng thái loading

  if (isLoading) {
    return <div>Loading...</div>; // Hoặc một spinner đẹp hơn
  }

  // Nếu chưa đăng nhập, chuyển về trang login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Nếu đã đăng nhập nhưng không có quyền, chuyển về trang "Unauthorized" hoặc trang chủ
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Hoặc tới trang 403 Forbidden
  }

  // Nếu có quyền, render component con
  return <>{children}</>;
};

export default ProtectedRoute;