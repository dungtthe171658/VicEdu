import express from "express";
import enrollmentRoutes from "./routes/enrollment.route";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";

import courseRoutes from "./routes/course.route";
import bookRoutes from "./routes/book.route";
import categoryRoutes from "./routes/category.route";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import orderRoutes from "./routes/order.route";
import reviewRouter from "./routes/review.route";
import uploadRoutes from "./routes/upload.route";
import lessonRoutes from "./routes/lesson.route";
import paymentRoutes from "./routes/payment.route"; // <-- THÃŠM
import chatRoutes from "./routes/chat.route";
import chatTestRoutes from "./routes/chat-test.route";
import subtitleRoutes from "./routes/subtitle.route";
import historyRoutes from "./routes/history.route";
import commentRoutes from "./routes/comment.route";
import quizzRoutes from "./routes/quiz.route";
import cartRoutes from "./routes/cart.route";
import voucherRoutes from "./routes/voucher.routes";

// import apiRoutes from "./routes/index";
const app = express();

// Middleware cÆ¡ báº£n
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/api/payments", paymentRoutes);
app.use("/api/enrollments", enrollmentRoutes);
// ÄÄƒng kÃ½ routes
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
app.use("/api/subtitles", subtitleRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/quizzes", quizzRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/vouchers", voucherRoutes);

//app.use("/api", apiRoutes);
export default app;
