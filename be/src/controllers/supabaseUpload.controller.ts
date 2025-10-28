import { Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase";
import crypto from "crypto";

function sanitizeFilename(name = "video.mp4") {
  return name.replace(/[^\w.\-]/g, "_");
}

/**
 * POST /api/uploads/supabase/signed-upload
 * Body: { courseId?: string, filename?: string, contentType?: string, path?: string }
 * Returns: { path, token, expiresIn }
 */
export async function createSignedUploadUrl(req: Request, res: Response) {
  try {
    if (!supabaseAdmin) return res.status(500).json({ message: "Supabase not configured" });
    const { courseId, filename, contentType, path } = req.body as {
      courseId?: string;
      filename?: string;
      contentType?: string;
      path?: string;
    };

    const bucket = process.env.SUPABASE_VIDEO_BUCKET || "videos";
    const safeName = sanitizeFilename(filename || "video.mp4");
    const keyPath = path || `lessons/${courseId || "misc"}/${Date.now()}_${safeName}`;

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(keyPath, 60 * 5); // 5 minutes

    if (error) return res.status(500).json({ message: error.message });

    return res.json({ path: keyPath, token: data.token, expiresIn: 300, bucket });
  } catch (e: any) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
}

