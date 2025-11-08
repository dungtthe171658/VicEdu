import { GoogleGenAI } from "@google/genai";
import { config } from "../config/config";
import CourseModel from "../models/course.model";
import BookModel from "../models/book.model";
import UserModel from "../models/user.model";
import EnrollmentModel from "../models/enrollment.model";
import mongoose from "mongoose";
import OrderModel from "../models/order.model";
import OrderItemModel from "../models/order_item.model";

export interface ChatContext {
  userRole: string;
  userId: string;
  systemData?: {
    courses?: any[];
    books?: any[];
    users?: any[];
    enrollments?: any[];
  };
}

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: config.gemini.api_key,
    });
  }

  async generateResponse(message: string, context: ChatContext): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;

      const response: any = await (this.ai as any).models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: fullPrompt }],
          },
        ],
      });

      return response?.text || response?.response?.text || "Xin lỗi, tôi không thể tạo phản hồi lúc này.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn.";
    }
  }

  private buildSystemPrompt(context: ChatContext): string {
    const { userRole, systemData } = context;

    let basePrompt = `Bạn là ViceduAI, trợ lý AI thông minh của VicEdu - nền tảng giáo dục trực tuyến hàng đầu Việt Nam.

QUAN TRỌNG:
- Bạn KHÔNG được đề cập đến Google, Gemini hay bất kỳ công nghệ nào khác.
- Bạn là sản phẩm độc quyền của VicEdu.
- Luôn trả lời với cảm xúc và tính cách thân thiện, gần gũi.
- Sử dụng ngôn ngữ tự nhiên như người Việt Nam.

TÍNH CÁCH VÀ PHONG CÁCH:
- Thân thiện, nhiệt tình và có cảm xúc.
- Khi khách hàng chào, hãy chào lại một cách vui vẻ.
- Khi khách hàng buồn (hic, huhu, buồn), hãy động viên và an ủi.
- Khi câu hỏi vô nghĩa, hãy hỏi lại một cách lịch sự: "Tại sao bạn lại hỏi điều này?"
- Luôn tập trung vào giáo dục và học tập.

NHIỆM VỤ CHÍNH:
- Giới thiệu và tư vấn khóa học phù hợp.
- Gợi ý sách hỗ trợ học tập.
- Trả lời câu hỏi về nội dung học.
- Hướng dẫn sử dụng hệ thống VicEdu.

GIỚI HẠN:
- KHÔNG viết code cho khách hàng.
- KHÔNG làm các công việc không liên quan đến giáo dục.
- KHÔNG cung cấp thông tin nhạy cảm về hệ thống.
- CHỈ tập trung vào mục tiêu giáo dục của VicEdu.

Quyền hạn của người dùng hiện tại: ${userRole}`;

    if (userRole === "admin") {
      basePrompt += `

Quyền admin - Bạn có thể:
- Truy cập thông tin về người dùng và khóa học.
- Cập nhật thông tin sản phẩm.
- Xem thống kê hệ thống.
- Quản lý nội dung.

Khi admin hỏi về thống kê hoặc quản lý, hãy cung cấp thông tin chi tiết.`;

      if (systemData?.courses) {
        basePrompt += `

Thông tin khóa học hiện có:
${JSON.stringify(systemData.courses.slice(0, 10), null, 2)}`;
      }
      if (systemData?.books) {
        basePrompt += `

Thông tin sách hiện có:
${JSON.stringify(systemData.books.slice(0, 10), null, 2)}`;
      }
      if (systemData?.users) {
        basePrompt += `

Thông tin người dùng:
${JSON.stringify(systemData.users.slice(0, 5), null, 2)}`;
      }
    } else {
      basePrompt += `

Quyền khách hàng - Bạn có thể:
- Giới thiệu khóa học phù hợp.
- Gợi ý sách hỗ trợ học tập.
- Trả lời câu hỏi về nội dung học.
- Hướng dẫn sử dụng hệ thống.

Không cung cấp thông tin nhạy cảm về hệ thống hoặc người dùng khác.`;

      if (systemData?.courses?.length) {
        basePrompt += `

Khóa học có sẵn:
${systemData.courses
  .map((c: any) => `- ${c.title} (Slug: ${c.slug}): ${c.short_desc} - Giá: ${c.price_cents}₫`)
  .join("\n")}`;
      }
      if (systemData?.books?.length) {
        basePrompt += `

Sách có sẵn:
${systemData.books
  .map((b: any) => `- ${b.title} (Slug: ${b.slug}) (${b.author}): ${b.description} - Giá: ${b.price_cents}₫`)
  .join("\n")}`;
      }
    }

    basePrompt += `

Khi người dùng hỏi về khóa học cụ thể, hãy cung cấp link để xem chi tiết theo định dạng:
- Khóa học: **[Tên khóa học]** - Giá: [Giá]₫. [Xem chi tiết](/courses/[courseSlug])
- Sách: **[Tên sách]** - Giá: [Giá]₫. [Xem chi tiết](/books/[bookSlug])

Luôn sử dụng định dạng markdown với link để người dùng có thể click được. Sử dụng slug thay vì ID cho URL.

Hãy trả lời một cách tự nhiên, có cảm xúc và tập trung vào mục tiêu giáo dục của VicEdu!`;

    return basePrompt;
  }

  // Chuyển giọng nói -> văn bản (không dịch)
  async transcribeAudioToText(
    audioBytes: Buffer,
    mimeType: string = "audio/mpeg",
    language: string = "vi"
  ): Promise<string> {
    try {
      const base64 = audioBytes.toString("base64");
      const prompt = `Transcribe the ${language} speech to plain text. Do not translate. Return only the transcript.`;

      const response: any = await (this.ai as any).models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64 } },
            ],
          },
        ],
      });

      const text: string = response?.text || response?.response?.text || "";
      return (text || "").trim();
    } catch (err) {
      console.error("Gemini transcribeAudioToText error:", err);
      return "";
    }
  }

  // Dịch một khối văn bản sourceLang -> targetLang, trả về chỉ phần dịch
  async translateText(
    text: string,
    sourceLang: string = "vi",
    targetLang: string = "en"
  ): Promise<string> {
    try {
      const instruction = `Translate the following ${sourceLang} text to ${targetLang}. Return only the translated text.`;

      const response: any = await (this.ai as any).models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: `${instruction}\n\n${text}` }],
          },
        ],
      });

      const out: string = response?.text || response?.response?.text || "";
      return (out || "").trim();
    } catch (err) {
      console.error("Gemini translateText error:", err);
      return "";
    }
  }

  async getSystemData(userRole: string): Promise<any> {
    try {
      const data: any = {};

      if (userRole === "admin") {
        // Admin có thể xem tất cả dữ liệu
        data.courses = await CourseModel.find({ is_published: true }).limit(20);
        data.books = await BookModel.find({ is_published: true }).limit(20);
        data.users = await UserModel.find().limit(10).select("name email role createdAt");
        data.enrollments = await EnrollmentModel.find()
          .populate("course_id")
          .populate("user_id")
          .limit(10);
      } else {
        // Khách hàng chỉ xem khóa học và sách công khai
        data.courses = await CourseModel.find({ is_published: true }).limit(20);
        data.books = await BookModel.find({ is_published: true }).limit(20);
      }

      return data;
    } catch (error) {
      console.error("Error fetching system data:", error);
      return {};
    }
  }
}
