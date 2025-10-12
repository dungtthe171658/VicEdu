import React from "react";
import { Link, Outlet } from "react-router-dom";

const UserHeader = () => {
  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gray-800">
          VicEdu
        </Link>

        {/* Desktop menu */}
        <div className="flex items-center space-x-4">
          <Link
            to="/courses"
            className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Khóa học
          </Link>
          <Link
            to="/books"
            className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Sách
          </Link>
          <Link
            to="/about"
            className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Giới thiệu
          </Link>
          <Link
            to="/login"
            className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Đăng nhập
          </Link>
        </div>
      </nav>
    </header>
  );
};

const UserFooter = () => (
  <footer className="bg-gray-800 text-white mt-auto">
    <div className="container mx-auto px-6 py-4 text-center">
      <p>&copy; 2025 VicEdu. All rights reserved.</p>
    </div>
  </footer>
);

const UserLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <UserHeader />
      <main className="flex-grow">
        <Outlet /> {/* Nội dung các trang con hiển thị ở đây */}
      </main>
      <UserFooter />
    </div>
  );
};

export default UserLayout;
