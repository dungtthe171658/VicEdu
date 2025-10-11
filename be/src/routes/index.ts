// routes/index.ts
import express from "express";
import bookRoutes from "./book.route.js"; // hoặc .ts nếu chưa build

const router = express.Router();

// mount tất cả book routes vào /books
router.use("/books", bookRoutes);

export default router;
