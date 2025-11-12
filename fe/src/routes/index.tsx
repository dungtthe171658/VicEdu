// src/routes/index.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";

// 🔹 Layouts
import UserLayout from "../components/layout/UserLayout";
import AdminLayout from "../pages/dashboard/Layout/AdminLayout";
import TeacherLayout from "../pages/dashboard/Layout/TeacherLayout";

import ProfilePage from "../pages/my-account/ProfilePage";
import MyCoursesPage from "../pages/my-account/MyCoursesPage";
import OrderHistoryPage from "../pages/my-account/OrderHistoryPage.tsx";

// 🔹 Public pages
import about from "../pages/user/about.tsx";
import HomePage from "../pages/user/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import BookListPage from "../pages/books/BookListPage";
import BookDetailPage from "../pages/books/BookDetailPage";
import { CoursePage } from "../pages/courses/CoursePage";
import MyBooksPage from "../pages/books/MyBooksPage";

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
import ManageOrdersPage from "../pages/dashboard/Admin/ManageOrdersPage.tsx";
import ManageCategoriesPage from "../pages/dashboard/Admin/ManageCategoriesPage";
import ManageCoursesPage from "../pages/dashboard/Admin/ManageCoursesPage";
import CourseManageDetail from "../pages/dashboard/Admin/CourseManageDetail";
import ManageReviewsPage from "../pages/dashboard/Admin/ManageReviewsPage";
import LessonManageDetail from "../pages/dashboard/Admin/LessonManageDetail";
import PendingEditsAdmin from "../pages/dashboard/Admin/PendingEditsAdmin";

// 🔹 Teacher dashboard pages
import DashboardTeacherPage from "../pages/dashboard/Teacher/DashboardTeacherPage";
import ManageCoursesTeacherPage from "../pages/dashboard/Teacher/ManageCoursesTeacherPage";
import ManageStudentsPage from "../pages/dashboard/Teacher/ManageStudentsPage";
import CourseManageDetailTeacher from "../pages/dashboard/Teacher/CourseManageDetailTeacher";
import LessonManageDetailTeacher from "../pages/dashboard/Teacher/LessonManageDetailTeacher";
import PendingEditsTeacher from "../pages/dashboard/Teacher/PendingEditsTeacher";
import ManageCommentTeacherPages from "../pages/dashboard/Teacher/ManageCommentTeacherPages";

// 🔹 Protected route
import ProtectedRoute from "./ProtectedRoute";
import About from "../pages/user/about.tsx";

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
        <Route path="/courses" element={<CoursePage />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/about" element={<About />} />
        <Route path="/my-courses" element={<MyCoursesPage />} />
        <Route path="/my-orders" element={<OrderHistoryPage />} />

        {/* Payment callbacks */}
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/payment-cancel" element={<PaymentCancelPage />} />
        <Route path="/payment-result" element={<PaymentResultPage />} />

        {/* Books */}
        <Route path="books" element={<BookListPage />} />
        <Route path="books/:id" element={<BookDetailPage />} />
        <Route path="/my-books" element={<MyBooksPage />} />

        {/* Route test BookManagementPage */}
        <Route path="test/manage-books" element={<BookManagementPage />} />
      </Route>

      {/* 🔒 Dashboard (Admin / Teacher) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
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

        <Route
          path="manage-orders"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageOrdersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="manage-courses"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageCoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-courses/:courseId"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CourseManageDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-courses/:courseId/lessons/:lessonId"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <LessonManageDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="manage-categories"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageCategoriesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="manage-reviews"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageReviewsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="pending-edits"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <PendingEditsAdmin />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 👨‍🏫 Teacher routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardTeacherPage />} />
        <Route path="manage-courses" element={<ManageCoursesTeacherPage />} />
        <Route
          path="manage-courses/:courseId"
          element={<CourseManageDetailTeacher />}
        />
        <Route
          path="manage-courses/:courseId/lessons/:lessonId"
          element={<LessonManageDetailTeacher />}
        />
        <Route path="manage-students" element={<ManageStudentsPage />} />
        <Route path="manage-comments" element={<ManageCommentTeacherPages />} />
        <Route path="pending-edits" element={<PendingEditsTeacher />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
