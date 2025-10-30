import express from "express";
import enrollmentRoutes from "./routes/enrollment.route";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";

import courseRoutes from "./routes/course.route";
import bookRoutes from "./routes/book.route";
import categoryRoutes from "./routes/category.routes";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import orderRoutes from "./routes/order.route";
import reviewRouter from "./routes/review.route";
import uploadRoutes from "./routes/upload.route";
import lessonRoutes from "./routes/lesson.route";
import paymentRoutes from "./routes/payment.route"; // <-- THÊM
import chatRoutes from "./routes/chat.route";
import chatTestRoutes from "./routes/chat-test.route";

// import apiRoutes from "./routes/index";
const app = express();

// Middleware cơ bản
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/api/payments", paymentRoutes);
app.use("/api/enrollments", enrollmentRoutes);
// Đăng ký routes
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/lesson", lessonRoutes);
app.use("/api/reviews", reviewRouter);
app.use("/api/uploads", uploadRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/chat-test", chatTestRoutes);

//app.use("/api", apiRoutes);
export default app;
