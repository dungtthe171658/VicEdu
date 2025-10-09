// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
// Giả sử bạn có một custom hook `useAuth` để lấy thông tin user đã đăng nhập
// Bạn sẽ cần tự tạo hook này dựa trên logic xác thực của mình
import { useAuth } from '../../hooks/useAuth';

const Sidebar = () => {
  // Giả sử useAuth() trả về { user: { role: 'admin' } } hoặc { user: { role: 'teacher' } }
  const { user } = useAuth();

  const baseLinkClass = "block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 hover:text-white";
  const activeLinkClass = "bg-blue-700 text-white";

  return (
    <aside className="w-64 bg-gray-800 text-gray-300 p-4">
      <nav>
        {/* LINK DÙNG CHUNG */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}
          end // 'end' prop để nó không active khi vào route con
        >
          Tổng quan
        </NavLink>

        {/* LINK CHỈ DÀNH CHO ADMIN */}
        {user?.role === 'admin' && (
          <NavLink
            to="/dashboard/manage-users"
            className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}
          >
            Quản lý người dùng
          </NavLink>
        )}

        {/* LINK CHỈ DÀNH CHO TEACHER */}
        {user?.role === 'teacher' && (
          <NavLink
            to="/dashboard/manage-students"
            className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}
          >
            Quản lý học sinh
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;