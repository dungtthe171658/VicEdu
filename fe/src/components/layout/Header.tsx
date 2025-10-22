// src/components/layout/Header.tsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { FaBell, FaUserCircle, FaSignOutAlt, FaCog } from "react-icons/fa";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-md px-6 py-3 flex justify-between items-center">
      {/* Trái: logo/tiêu đề + link nhanh */}
      <div className="flex items-center space-x-6">
        <h1 className="text-xl font-semibold text-gray-700">Dashboard</h1>

        {/* Link Sách (admin chuyển vào trang quản trị sách, user -> books) */}
        <Link
          to={user?.role === "admin" ? "/dashboard/manage-books" : "/books"}
          className="text-gray-700 hover:text-gray-900 font-medium"
        >
          Sách
        </Link>
      </div>

      {/* Phải: thông báo + user/login */}
      <div className="flex items-center space-x-4">
        {/* Thông báo (placeholder) */}
        <button className="relative text-gray-600 hover:text-gray-800 focus:outline-none">
          <FaBell size={22} />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
        </button>

        {/* Nếu chưa đăng nhập -> nút Đăng nhập */}
        {!user ? (
          <Link
            to="/login"
            className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Đăng nhập
          </Link>
        ) : (
          // Nếu đã đăng nhập -> avatar + dropdown
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen((s) => !s)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="User Avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <FaUserCircle size={28} className="text-gray-600" />
              )}
              <span className="hidden md:inline text-sm font-medium text-gray-700">
                {user?.name || "User"}
              </span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-2 text-sm text-gray-700">
                  <p className="font-semibold truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <div className="border-t border-gray-200" />

                {/* Cài đặt tài khoản */}
                <Link
                  to="/dashboard/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <FaCog className="mr-2" />
                  Cài đặt tài khoản
                </Link>

                {/* Đăng xuất */}
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
        )}
      </div>
    </header>
  );
};

export default Header;
