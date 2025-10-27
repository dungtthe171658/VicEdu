// routes/index.ts
import express from "express";
import bookRoutes from "./book.route"; // hoặc .ts nếu chưa build
import categoryRoutes from './category.route';
import courseRoutes from './course.route';
import orderRoutes from './order.route';
import paymentRoutes from './payment.route';
import reviewRoutes from './review.route';
import dashboardRoutes from './dashboard.route';
import uploadRoutes from './upload.route';
import authRoutes from './auth.route';
import userRoutes from './user.route';
import homeRoutes from "./home.routes";

const router = express.Router();

// mount tất cả book routes vào /books
router.use("/books", bookRoutes);
router.use('/categories', categoryRoutes);
router.use('/courses', courseRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/dashboard', dashboardRoutes);
router.use("/home", homeRoutes);
router.use("/user", userRoutes);
router.use("/uploads", uploadRoutes);

export default router;
