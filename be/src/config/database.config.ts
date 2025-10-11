import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async (): Promise<void> => {
  try {
    // trim() để loại bỏ khoảng trắng vô tình ở đầu/cuối
    const uri = process.env.MONGO_URI?.trim();

    if (!uri) {
      throw new Error("Missing MONGO_URI in environment variables");
    }

    await mongoose.connect(uri);
    console.log(`MongoDB connected successfully to: ${uri}`);
  } catch (error: any) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
