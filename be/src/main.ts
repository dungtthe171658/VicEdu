import { config, connectDB } from "./config";
import { logger } from "./utils";
import { ApiService } from "./services";
import app from "./app";

// Import models (đảm bảo được đăng ký vào mongoose)
import "./models/category.model";
import "./models/book.model";

const main = async (): Promise<void> => {
  logger.info(`Running service: ${config.service_name || "api"}`);

  switch (config.service_name) {
    default:
      await ApiService.startServe(app);
      break;
  }
};

(async () => {
  try {
    await connectDB();
    logger.info("Database connected successfully");

    await main();
  } catch (error: any) {
    logger.error("Application startup failed:", error.message);
    process.exit(1);
  }
})();
