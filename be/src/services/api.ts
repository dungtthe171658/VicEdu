import { Application } from "express";
import { config } from "../config";
import { logger } from "../utils";

const startServe = async (app: Application) => {
  // Start server với app được truyền từ bên ngoài
  const server = app.listen(config.serverPort, () => {
    logger.info(
      `✅ Server started (${config.node_env}) at http://localhost:${config.serverPort}`
    );
  });

  // (Tùy chọn) nếu bạn có WebSocket hoặc socket.io sau này
  // await WebSocketService.InitWebSocket({ server });
};

export const ApiService = {
  startServe,
};
