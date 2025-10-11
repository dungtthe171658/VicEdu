import { Routes, Route } from 'react-router-dom';

// Layouts
import UserLayout from '../components/layout/UserLayout';
import DashboardLayout from '../components/layout/DashboardLayout';

// Pages
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/user/HomePage';
import OverviewPage from '../pages/dashboard/Shared/OverviewPage';
import ManageUsersPage from '../pages/dashboard/Admin/ManageUsersPage';
import ManageStudentsPage from '../pages/dashboard/Teacher/ManageStudentsPage';

// Book pages (phần bán sách)
import BookListPage from '../pages/books/BookListPage';
import BookDetailPage from '../pages/books/BookDetailPage';
import BookManagementPage from '../pages/dashboard/Admin/BookManagementPage';

// Route bảo vệ
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Trang đăng nhập */}
      <Route path="/login" element={<LoginPage />} />

      {/* Trang người dùng */}
      <Route path="/" element={<UserLayout />}>
        <Route index element={<HomePage />} />

        {/* 📚 Trang sách (public) */}
        <Route path="books" element={<BookListPage />} />
        <Route path="books/:id" element={<BookDetailPage />} />
      </Route>

      {/* Dashboard cho Admin / Teacher */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Trang chung */}
        <Route index element={<OverviewPage />} />

        {/* Admin quản lý người dùng */}
        <Route
          path="manage-users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageUsersPage />
            </ProtectedRoute>
          }
        />

        {/* Teacher quản lý sinh viên */}
        <Route
          path="manage-students"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ManageStudentsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin quản lý sách (phần bạn làm) */}
        <Route
          path="manage-books"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <BookManagementPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
