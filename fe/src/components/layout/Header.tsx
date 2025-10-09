// src/components/layout/Header.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Giả sử bạn có hook này

// Import icons (sử dụng thư viện react-icons cho tiện lợi)

import { FaBell, FaUserCircle, FaSignOutAlt, FaCog } from 'react-icons/fa';

const Header = () => {
  // Lấy thông tin người dùng và hàm đăng xuất từ custom hook
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State để quản lý việc mở/đóng dropdown menu của user
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Dùng để xử lý click ra ngoài thì đóng dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleLogout = () => {
    // Gọi hàm logout từ auth context
    logout();
    // Chuyển hướng người dùng về trang đăng nhập
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md px-6 py-3 flex justify-between items-center">
      {/* Phần bên trái: Có thể là ô tìm kiếm hoặc tiêu đề trang */}
      <div>
        <h1 className="text-xl font-semibold text-gray-700">Dashboard</h1>
      </div>

      {/* Phần bên phải: Chứa các icon chức năng và thông tin người dùng */}
      <div className="flex items-center space-x-4">
        {/* Icon Thông báo */}
        <button className="relative text-gray-600 hover:text-gray-800 focus:outline-none">
          <FaBell size={22} />
          {/* Badge thông báo mới (ví dụ) */}
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Avatar và Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            {/* Sử dụng ảnh avatar thật nếu có, nếu không thì dùng icon */}
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="User Avatar"
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <FaUserCircle size={28} className="text-gray-600" />
            )}
            <span className="hidden md:inline text-sm font-medium text-gray-700">
              {user?.fullName || 'User Name'}
            </span>
          </button>

          {/* Dropdown Menu Content */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <div className="px-4 py-2 text-sm text-gray-700">
                <p className="font-semibold">{user?.fullName || 'User Name'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <div className="border-t border-gray-200"></div>
              <Link
                to="/dashboard/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsDropdownOpen(false)}
              >
                <FaCog className="mr-2" />
                Cài đặt tài khoản
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <FaSignOutAlt className="mr-2" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;