// src/routes/index.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";

// 🔹 Layouts
import UserLayout from "../components/layout/UserLayout";
import AdminLayout from "../pages/dashboard/Layout/AdminLayout";
import TeacherLayout from "../pages/dashboard/Layout/TeacherLayout";

// 🔹 Public pages
import HomePage from "../pages/user/HomePage";
import LoginPage from "../pages/LoginPage";
import BookListPage from "../pages/books/BookListPage";
import BookDetailPage from "../pages/books/BookDetailPage";

// 🔹 Dashboard pages
import OverviewPage from "../pages/dashboard/Shared/OverviewPage";
import ManageUsersPage from "../pages/dashboard/Admin/ManageUsersPage";
//import ManageStudentsPage from "../pages/dashboard/Teacher/ManageStudentsPage";
import BookManagementPage from "../pages/books/BookManagementPage";
import RegisterPage from "../pages/RegisterPage";
// 🔹 Protected route
import ProtectedRoute from "./ProtectedRoute";
import { CoursePage } from "../pages/courses/CoursePage";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Trang đăng nhập */}
      <Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />
      {/* Public routes (User layout) */}
      <Route element={<UserLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/courses" element={<CoursePage />} />
        {/* 
        <Route path="/courses/:slug" element={<CategoryDetail />} />
        <Route path="/courses/:slug/:courseSlug" element={<CourseDetail />} />
 */}

        <Route path="books" element={<BookListPage />} />
        <Route path="books/:id" element={<BookDetailPage />} />
        {/* Route test BookManagementPage */}
        <Route path="test/manage-books" element={<BookManagementPage />} />
      </Route>

      {/* 🔒 Dashboard (Admin / Teacher) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin", "teacher"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Trang tổng quan */}
        <Route index element={<OverviewPage />} />

        {/* 🧑‍💼 Admin routes */}
        <Route
          path="manage-users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-books"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <BookManagementPage />
            </ProtectedRoute>
          }
        />

        {/* 👨‍🏫 Teacher routes */}
        <Route
          path="teacher"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherLayout  />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
