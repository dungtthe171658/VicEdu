import express from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";

import bookRoutes from "./routes/book.route";
import categoryRoutes from "./routes/category.routes";

const app = express();

// Middleware cơ bản
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Đăng ký routes
app.use("/api/books", bookRoutes);
app.use("/api/categories", categoryRoutes);

export default app;
