import { Link, Outlet, useNavigate } from "react-router-dom";
import "./Layout.css";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { FaUserCircle, FaSignOutAlt, FaBook, FaIdBadge } from "react-icons/fa";
import CartIcon from "../common/CartIcon"; // ← thêm import

const UserHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(
    user?.avatar ? String(user.avatar) : undefined
  );

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Resolve avatar from backend if missing; keep local state for onError fallback
  useEffect(() => {
    setAvatarSrc(user?.avatar ? String(user.avatar) : undefined);
    if (user && !user.avatar) {
      import("../../api/userApi")
        .then((m: any) => m.default.getMyAvatar())
        .then((res: any) =>
          import("../../utils/buildAvatarUrl").then((mod: any) =>
            mod.buildAvatarUrl(res?.data?.avatar)
          )
        )
        .then((url: string | undefined) => {
          if (url) setAvatarSrc(url);
        })
        .catch(() => {
          // silent: fallback shows icon
        });
    }
  }, [user?.avatar, user?._id]);

  return (
    <header className="user-header">
      <nav>
        <Link to="/" className="logo">
          VicEdu
        </Link>

        <div className="menu flex items-center gap-4">
          <Link to="/courses">Khóa học</Link>
          <Link to="/books">Sách</Link>
          <Link to="/about">Giới thiệu</Link>

          {/* 🛒 Cart icon + badge */}
          <CartIcon />

          {!user ? (
            <Link to="/login" className="login">
              Đăng nhập
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen((s) => !s)}
                className="flex items-center gap-2 focus:outline-none"
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="avatar"
                    className="h-8 w-8 rounded-full object-cover"
                    onError={() => setAvatarSrc(undefined)}
                  />
                ) : (
                  <FaUserCircle size={26} className="text-gray-600" />
                )}
                <span className="hidden sm:inline text-sm font-medium text-gray-700">
                  {user.name || "User"}
                </span>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-sm text-gray-700">
                    <p className="font-semibold truncate">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="border-t border-gray-200" />
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setOpen(false)}
                  >
                    <FaIdBadge className="mr-2" /> Hồ sơ
                  </Link>
                  <Link
                    to="/my-courses"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setOpen(false)}
                  >
                    <FaBook className="mr-2" /> Khóa học của tôi
                  </Link>
                  <Link
                    to="/my-books"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setOpen(false)}
                  >
                    📚 Sách của tôi
                  </Link>
                  <Link
                    to="/my-orders"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setOpen(false)}
                  >
                    🧾 Đơn hàng của tôi
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FaSignOutAlt className="mr-2" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

const UserFooter = () => (
  <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white text-xl font-bold mb-4">VicEdu</h3>
              <p className="text-gray-400">
                Nền tảng học trực tuyến hàng đầu Việt Nam
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Khám phá</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">Khóa học</a></li>
                <li><a href="#" className="hover:text-white transition">Sách điện tử</a></li>
                <li><a href="#" className="hover:text-white transition">Giảng viên</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-white transition">Liên hệ</a></li>
                <li><a href="#" className="hover:text-white transition">Điều khoản</a></li>
                <li><a href="#" className="hover:text-white transition">Chính sách</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Kết nối</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition">YouTube</a></li>
                <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition">Instagram</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p>&copy; 2025 VicEdu. All rights reserved.</p>
          </div>
        </div>
      </footer>
);

const UserLayout = () => {
  return (
    <div className="user-layout">
      <UserHeader />
      <main className="user-main">
        <Outlet />
      </main>
      <UserFooter />
    </div>
  );
};

export default UserLayout;