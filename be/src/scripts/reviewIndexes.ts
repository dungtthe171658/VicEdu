import { connectDB } from "../config/database.config";
import ReviewModel from "../models/review.model";

(async () => {
  try {
    await connectDB();
    await ReviewModel.syncIndexes();
    // Also helpful to ensure existing duplicates are logged
    console.log("Review indexes synced successfully");
  } catch (e: any) {
    console.error("Failed to sync review indexes:", e?.message || e);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
})();

