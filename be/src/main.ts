import { ApiService } from "./services";
import { AES, logger, MathUtils } from "./utils";
import { config, connectDB } from "./config";
import "./models/category.model";
import "./models/book.model";

const main = async (): Promise<void> => {
  logger.info(`Running service: ${config.service_name || "api"}`);

  switch (config.service_name) {
    default:
      await ApiService.startServe();
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
