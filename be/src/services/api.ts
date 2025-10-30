import { Application } from "express";
import { config } from "../config";
import { logger } from "../utils";

const startServe = async (app: Application) => {
  // Prefer PORT env if provided, otherwise config.serverPort
  const basePort = process.env.PORT
    ? Number(process.env.PORT)
    : config.serverPort;
  const maxAttempts = 10; // try basePort..basePort+9

  let attempt = 0;
  let currentPort = basePort;

  const startOnPort = (port: number): void => {
    const server = app
      .listen(port, () => {
        logger.info(
          `Server started (${config.node_env}) at http://localhost:${port}`
        );
      })
      .on("error", (err: any) => {
        if (err && err.code === "EADDRINUSE" && attempt < maxAttempts - 1) {
          attempt += 1;
          currentPort = basePort + attempt;
          logger.warn(
            `Port ${port} in use. Retrying with port ${currentPort} (attempt ${
              attempt + 1
            }/${maxAttempts})`
          );
          startOnPort(currentPort);
        } else {
          logger.error(`Failed to start server: ${err?.message || err}`);
          process.exit(1);
        }
      });
  };

  startOnPort(currentPort);

  // (Tùy chọn) nếu bạn có WebSocket hoặc socket.io sau này
  // await WebSocketService.InitWebSocket({ server });
};

export const ApiService = {
  startServe,
};
