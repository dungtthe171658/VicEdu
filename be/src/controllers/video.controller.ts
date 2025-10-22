// src/controllers/video.controller.ts
import { Request, Response } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  MediaConvertClient,
  CreateJobCommand,
  GetJobCommand,
} from "@aws-sdk/client-mediaconvert";

import LessonModel from "../models/lesson.model";
import CourseModel from "../models/course.model";

const AWS_REGION = process.env.AWS_REGION!;
const S3_UPLOAD_BUCKET = process.env.S3_UPLOAD_BUCKET!;
const S3_OUTPUT_BUCKET = process.env.S3_OUTPUT_BUCKET!;
const CLOUDFRONT_HLS_DOMAIN = process.env.CLOUDFRONT_HLS_DOMAIN!; // dxxxx.cloudfront.net
const MEDIACONVERT_ENDPOINT = process.env.MEDIACONVERT_ENDPOINT!;
const MEDIACONVERT_ROLE_ARN = process.env.MEDIACONVERT_ROLE_ARN!;

const s3 = new S3Client({ region: AWS_REGION });
const mediaconvert = new MediaConvertClient({
  region: AWS_REGION,
  endpoint: MEDIACONVERT_ENDPOINT, // rất quan trọng với MediaConvert
});

const isValidObjectId = (id: any) => mongoose.Types.ObjectId.isValid(id);
const toObjectId = (id: any) =>
  isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null;

/** Sanitize tên file cơ bản */
function sanitizeFilename(name = "source.mp4") {
  return name.replace(/[^\w.\-]/g, "_");
}

/** Xây playback URL chuẩn cho CloudFront */
function buildPlaybackUrl(outputPrefix: string) {
  const prefix = outputPrefix.endsWith("/") ? outputPrefix : `${outputPrefix}/`;
  return `https://${CLOUDFRONT_HLS_DOMAIN}/${prefix}index.m3u8`;
}

/**
 * POST /api/videos/upload-url
 * Body: { lessonId: string, filename?: string, contentType?: string }
 * -> Trả về presigned PUT URL để FE upload video thẳng lên S3 (bucket upload)
 */
export const getUploadUrl = async (req: Request, res: Response) => {
  try {
    const { lessonId, filename, contentType } = req.body as {
      lessonId: string;
      filename?: string;
      contentType?: string; // ex: video/mp4
    };

    const lid = toObjectId(lessonId);
    if (!lid) return res.status(400).json({ message: "Invalid lessonId" });

    const lesson = await LessonModel.findById(lid);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    // (tuỳ chọn) kiểm tra course/teacher ở đây nếu cần
    // const course = await CourseModel.findById(lesson.course_id);
    // if (!course || String(course.teacher) !== String(req.user?._id)) { ... }

    const safeName = sanitizeFilename(filename);
    const key = `uploads/${lessonId}/${crypto.randomUUID()}-${safeName}`;

    const cmd = new PutObjectCommand({
      Bucket: S3_UPLOAD_BUCKET,
      Key: key,
      ContentType: contentType || "video/mp4",
    });

    // URL sống 5 phút
    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });

    // cập nhật trạng thái để theo dõi
    (lesson as any).status = "uploading";
    (lesson as any).source_key = key;
    await lesson.save();

    return res.json({ uploadUrl, key });
  } catch (error: any) {
    console.error("getUploadUrl error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * POST /api/videos/start-transcode
 * Body: { lessonId: string }
 * -> Tạo MediaConvert Job để render HLS vào S3_OUTPUT_BUCKET (thư mục hls/<lessonId>/)
 */
export const startTranscode = async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.body as { lessonId: string };

    const lid = toObjectId(lessonId);
    if (!lid) return res.status(400).json({ message: "Invalid lessonId" });

    const lesson = await LessonModel.findById(lid);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const sourceKey = (lesson as any).source_key;
    if (!sourceKey) {
      return res.status(400).json({ message: "Lesson has no source_key. Upload first." });
    }

    // Đích output HLS
    const outputPrefix = `hls/${lessonId}/`;
    const inputS3 = `s3://${S3_UPLOAD_BUCKET}/${sourceKey}`;
    const outputS3 = `s3://${S3_OUTPUT_BUCKET}/${outputPrefix}`;

    // Job settings tối thiểu (2 profile HLS)
    const params: any = {
      Role: MEDIACONVERT_ROLE_ARN,
      Settings: {
        Inputs: [
          {
            FileInput: inputS3,
          },
        ],
        OutputGroups: [
          {
            Name: "Apple HLS",
            OutputGroupSettings: {
              Type: "HLS_GROUP_SETTINGS",
              HlsGroupSettings: {
                Destination: outputS3,
                SegmentLength: 4,
                MinSegmentLength: 0,
                ManifestCompression: "NONE",
                DirectoryStructure: "SINGLE_DIRECTORY",
                // MediaConvert sẽ tạo file master manifest "index.m3u8" mặc định nếu không đổi tên
              },
            },
            Outputs: [
              {
                NameModifier: "_360p",
                ContainerSettings: { Container: "M3U8" },
                VideoDescription: {
                  Width: 640,
                  Height: 360,
                  CodecSettings: { Codec: "H_264" },
                },
              },
              {
                NameModifier: "_720p",
                ContainerSettings: { Container: "M3U8" },
                VideoDescription: {
                  Width: 1280,
                  Height: 720,
                  CodecSettings: { Codec: "H_264" },
                },
              },
            ],
          },
        ],
      },
    };

    const out = await mediaconvert.send(new CreateJobCommand(params));

    (lesson as any).status = "processing";
    (lesson as any).output_prefix = outputPrefix;
    await lesson.save();

    return res.json({ ok: true, jobId: out.Job?.Id || null });
  } catch (error: any) {
    console.error("startTranscode error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * GET /api/videos/jobs/:jobId/sync?lessonId=...
 * → Hỏi trạng thái MediaConvert Job; nếu COMPLETE thì cập nhật lesson.status='ready' và set playback_url.
 * (Dùng tạm khi bạn chưa set EventBridge+Lambda)
 */
export const syncJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { lessonId } = req.query as { lessonId?: string };

    if (!jobId) return res.status(400).json({ message: "Missing jobId" });
    const data = await mediaconvert.send(new GetJobCommand({ Id: jobId }));

    const status = data.Job?.Status; // SUBMITTED|PROGRESSING|COMPLETE|ERROR|CANCELED
    const lesson = lessonId ? await LessonModel.findById(lessonId) : null;

    if (status === "COMPLETE" && lesson) {
      const outputPrefix =
        (lesson as any).output_prefix ||
        `hls/${String(lesson._id)}/`;
      const playback = buildPlaybackUrl(outputPrefix);

      (lesson as any).status = "ready";
      (lesson as any).playback_url = playback;
      await lesson.save();
    }

    return res.json({ status, job: data.Job });
  } catch (error: any) {
    console.error("syncJobStatus error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * (Tuỳ chọn) POST /api/videos/upload-policy
 * Nếu bạn muốn dùng POST policy (form-data) thay cho PUT presigned, để upload từ trình duyệt cũ/mobile.
 * Body: { lessonId, filename, contentType }
 */
export const getUploadPolicy = async (req: Request, res: Response) => {
  try {
    const { lessonId, filename, contentType } = req.body as {
      lessonId: string;
      filename?: string;
      contentType?: string;
    };

    const lid = toObjectId(lessonId);
    if (!lid) return res.status(400).json({ message: "Invalid lessonId" });

    const lesson = await LessonModel.findById(lid);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const key = `uploads/${lessonId}/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;

    // Tự build policy bằng SDK v2/v3 cũng được; ở đây demo khung response để FE submit form:
    // Gợi ý: dùng @aws-sdk/s3-presigned-post (v3) nếu cần.
    return res.status(501).json({
      message: "Not implemented. Use PUT presigned via /videos/upload-url or implement S3 Presigned POST here.",
      example: {
        url: `https://${S3_UPLOAD_BUCKET}.s3.${AWS_REGION}.amazonaws.com/`,
        fields: { key, "Content-Type": contentType || "video/mp4", /* ...Signature fields... */ },
      },
    });
  } catch (error: any) {
    console.error("getUploadPolicy error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};
