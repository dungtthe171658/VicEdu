import React from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaPhoneAlt } from "react-icons/fa";

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <Link to="/">
            <img
              src="/logo.png" // 👈 thay bằng logo thật của bạn
              alt="VicEdu Logo"
              className="h-10"
            />
          </Link>

          {/* Ô tìm kiếm */}
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Tìm kiếm khóa học"
              className="w-64 pl-4 pr-10 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
          </div>
        </div>

        {/* Hotline + Buttons */}
        <div className="flex items-center space-x-4">
          {/* Hotline */}
          <div className="flex items-center text-orange-500 font-semibold">
            <FaPhoneAlt className="mr-2" />
            1900 6933
          </div>

          {/* Đăng nhập / Đăng ký */}
          <div className="flex items-center space-x-2">
            <Link
              to="/login"
              className="px-4 py-1 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Đăng Nhập
            </Link>
            <Link
              to="/register"
              className="px-4 py-1 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition"
            >
              Đăng Ký
            </Link>
          </div>
        </div>
      </div>

      {/* Thanh menu */}
      <nav className="bg-gray-50 border-t text-gray-700">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-6 px-6 py-2 text-sm font-medium">
          <Link to="/about" className="hover:text-blue-600">
            Giới thiệu
          </Link>
          <Link to="/teachers" className="hover:text-blue-600">
            Giáo viên
          </Link>
          <Link to="/practice" className="hover:text-blue-600">
            Phòng luyện
          </Link>
          <Link to="/chat" className="hover:text-blue-600">
            iChat - Hỏi đáp với AI
          </Link>
          <Link to="/career" className="hover:text-blue-600">
            Hướng nghiệp
          </Link>
          <Link to="/library" className="hover:text-blue-600">
            Thư viện
          </Link>
          <Link to="/guide" className="hover:text-blue-600">
            Hướng dẫn đăng ký học
          </Link>
          <Link to="/support" className="hover:text-blue-600">
            Hỗ trợ
          </Link>
          <Link to="/books" className="hover:text-blue-600">
            📚 Sách
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
