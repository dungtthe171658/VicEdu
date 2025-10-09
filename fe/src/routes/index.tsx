// src/routes/index.tsx
import { Routes, Route } from 'react-router-dom';

// Layouts
import UserLayout from '../components/layout/UserLayout'; // Layout cho trang người dùng
import DashboardLayout from '../components/layout/DashboardLayout'; // Layout chung cho admin/teacher
import LoginPage from '../pages/LoginPage'; // <-- Import trang mới
// Pages
import HomePage from '../pages/user/HomePage';
import OverviewPage from '../pages/dashboard/Shared/OverviewPage';
import ManageUsersPage from '../pages/dashboard/Admin/ManageUsersPage';
import ManageStudentsPage from '../pages/dashboard/Teacher/ManageStudentsPage';

// Component bảo vệ route (quan trọng!)
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Route cho người dùng bình thường */}
      <Route path="/" element={<UserLayout />}>
        <Route index element={<HomePage />} />
      </Route>

      {/* Route cho khu vực quản lý (Dashboard) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Trang con dùng chung */}
        <Route index element={<OverviewPage />} />

        {/* Trang con chỉ dành cho Admin */}
        <Route
          path="manage-users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageUsersPage />
            </ProtectedRoute>
          }
        />

        {/* Trang con chỉ dành cho Teacher */}
        <Route
          path="manage-students"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ManageStudentsPage />
            </ProtectedRoute>
          }
        />
      </Route>






      
    </Routes>
  );
};

export default AppRoutes;