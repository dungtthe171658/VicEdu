// routes/index.ts
import express from "express";
import bookRoutes from "./book.route"; // hoáº·c .ts náº¿u chÆ°a build
import categoryRoutes from "./category.route";
import courseRoutes from "./course.route";
import orderRoutes from "./order.route";
import paymentRoutes from "./payment.route";
import reviewRoutes from "./review.route";
import dashboardRoutes from "./dashboard.route";
import uploadRoutes from "./upload.route";
import authRoutes from "./auth.route";
import userRoutes from "./user.route";
import homeRoutes from "./home.routes";
import chatRoutes from "./chat.route";
import subtitleRoutes from "./subtitle.route";
import commentRoutes from "./comment.route";

const router = express.Router();

// mount táº¥t cáº£ book routes vÃ o /books
router.use("/books", bookRoutes);
router.use("/categories", categoryRoutes);
router.use("/courses", courseRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/reviews", reviewRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/home", homeRoutes);
router.use("/user", userRoutes);
router.use("/uploads", uploadRoutes);
router.use("/chat", chatRoutes);
router.use("/subtitles", subtitleRoutes);
router.use("/comments", commentRoutes);

export default router;

