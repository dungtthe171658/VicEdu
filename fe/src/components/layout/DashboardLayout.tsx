// src/components/layout/DashboardLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // Chúng ta sẽ tạo component này ngay sau đây
import Header from './Header';   // Component Header chung

const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar /> {/* Sidebar sẽ thay đổi menu tùy theo role */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
          <Outlet /> {/* Nội dung của trang con sẽ render ở đây */}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;