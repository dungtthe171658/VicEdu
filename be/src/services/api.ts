import express, { Application } from "express";
import { applyMiddleware } from "../middlewares";
import { config } from "../config";
import { logger } from "../utils";

// --- Import routes
import bookRoutes from "../routes/book.route";
// import { AuthRoute } from "../routes"; // nếu sau này có

// --- Setup router
const setupRouter = (app: Application) => {
  // ✅ Mount API routes here
  app.use("/api/books", bookRoutes);

  // Test route để check server
  app.get("/", (req, res) => {
    res.send("📚 API is running successfully!");
  });

  // AuthRoute(app); // sau này có thể thêm
};

const startServe = async () => {
  const app: Application = express();

  // Apply global middlewares
  applyMiddleware(app);

  // Apply all routers
  setupRouter(app);

  // Start server
  const server = app.listen(config.serverPort, () => {
    logger.info(
      `✅ Server started (${config.node_env}) at http://localhost:${config.serverPort}`
    );
  });

  // Nếu bạn có WebSocket sau này:
  // await WebSocketService.InitWebSocket({ server });
};

export const ApiService = {
  startServe,
};
