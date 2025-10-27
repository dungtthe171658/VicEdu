// src/controllers/upload.controller.ts
import { Request, Response } from "express";
import crypto from "crypto";

export const getCloudinarySignature = async (req: Request, res: Response) => {
  try {
    const { folder = "vicedu/images", upload_preset = "vicedu_default" } =
      req.query as any;

    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign = `folder=${folder}&timestamp=${timestamp}&upload_preset=${upload_preset}${process.env.CLOUDINARY_API_SECRET}`;

    const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

    // 🔥 Log toàn bộ env để check
    console.log("👉 Cloudinary ENV:", {
      CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      API_KEY: process.env.CLOUDINARY_API_KEY,
      API_SECRET: process.env.CLOUDINARY_API_SECRET?.slice(0, 5) + "...",
    });

    console.log("👉 Params FE gửi:", { folder, upload_preset });
    console.log("👉 Signature tạo ra:", signature);

    res.json({
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
      upload_preset,
    });
  } catch (e: any) {
    console.error("👉 Lỗi BE khi tạo chữ ký:", e);
    res.status(500).json({ message: e.message });
  }
};
