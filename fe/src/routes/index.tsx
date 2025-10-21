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
import RegisterPage from "../pages/RegisterPage";
import BookListPage from "../pages/books/BookListPage";
import BookDetailPage from "../pages/books/BookDetailPage";

// 🔹 Category / Courses / Cart
import { CategoryPage } from "../pages/category/CategoryPage.tsx";
import CourseDetail from "../pages/courses/CourseDetail.tsx";
import CartPage from "../pages/cart/CartPage.tsx";

// 🔹 Payment pages
import PaymentSuccessPage from "../pages/payment/PaymentSuccessPage";
import PaymentCancelPage from "../pages/payment/PaymentCancelPage";
import PaymentResultPage from "../pages/payment/PaymentResultPage";

// 🔹 Dashboard pages
import OverviewPage from "../pages/dashboard/Shared/OverviewPage";
import ManageUsersPage from "../pages/dashboard/Admin/ManageUsersPage";
import BookManagementPage from "../pages/books/BookManagementPage";

// 🔹 Protected route
import ProtectedRoute from "./ProtectedRoute";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Trang đăng nhập/đăng ký */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Public routes (User layout) */}
      <Route element={<UserLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/category" element={<CategoryPage />} />
        <Route path="/courses/:slug" element={<CourseDetail />} />
        <Route path="/cart" element={<CartPage />} />

        {/* Payment callbacks */}
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/payment-cancel" element={<PaymentCancelPage />} />
        <Route path="/payment-result" element={<PaymentResultPage />} />

        {/* Books */}
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
              <TeacherLayout />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
