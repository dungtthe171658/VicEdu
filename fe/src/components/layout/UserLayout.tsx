import { Link, Outlet } from "react-router-dom";
import "./Layout.css";

const UserHeader = () => {
  return (
    <header className="user-header">
      <nav>
        <Link to="/" className="logo">
          VicEdu
        </Link>

        <div className="menu">
          <Link to="/courses">Khóa học</Link>
          <Link to="/books">Sách</Link>
          <Link to="/about">Giới thiệu</Link>
          <Link to="/login" className="login">
            Đăng nhập
          </Link>
          {/* ✅ Nút Quản lý sách tạm bỏ check role */}
          <Link to="/test/manage-books" style={{ color: "red" }}>
            Test Quản lý sách
          </Link>
        </div>
      </nav>
    </header>
  );
};

const UserFooter = () => (
  <footer className="user-footer">
    <p>&copy; 2025 VicEdu. All rights reserved.</p>
  </footer>
);

const UserLayout = () => {
  return (
    <div className="user-layout">
      <UserHeader />
      <main className="user-main">
        <Outlet /> {/* Nội dung các trang con hiển thị ở đây */}
      </main>
      <UserFooter />
    </div>
  );
};

export default UserLayout;
