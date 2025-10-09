import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const UserHeader = () => (
  <header className="bg-white shadow-md">
    <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-gray-800">
        VicEdu
      </Link>
      <div>
        <Link to="/courses" className="text-gray-600 hover:text-gray-800 px-3 py-2">Khóa học</Link>
        <Link to="/about" className="text-gray-600 hover:text-gray-800 px-3 py-2">Giới thiệu</Link>
        <Link to="/login" className="bg-blue-500 text-white rounded px-4 py-2 ml-4 hover:bg-blue-600">
          Đăng nhập
        </Link>
      </div>
    </nav>
  </header>
);

const UserFooter = () => (
  <footer className="bg-gray-800 text-white mt-auto">
    <div className="container mx-auto px-6 py-4 text-center">
      <p>&copy; 2024 VicEdu. All rights reserved.</p>
    </div>
  </footer>
);

const UserLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <UserHeader />
      <main className="flex-grow">
        <Outlet /> {/* Nội dung của các trang con (HomePage, AboutPage,...) sẽ hiển thị ở đây */}
      </main>
      <UserFooter />
    </div>
  );
};

export default UserLayout;