import mongoose from "mongoose";
import dotenv from "dotenv";
import {config} from "./config";
import {logger} from "../utils";

export const connectDB = async () => {
  try {
    await mongoose.connect(config.database_url!);
    logger.info('Connected with database successfully!');
  } catch (error) {
    logger.error( 'Unable to connect with database: ',error);
    process.exit(1);
  }
};