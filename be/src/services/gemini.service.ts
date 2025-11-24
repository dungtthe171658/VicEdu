import { GoogleGenAI } from "@google/genai";
import { config } from "../config/config";
import CourseModel from "../models/course.model";
import BookModel from "../models/book.model";
import UserModel from "../models/user.model";
import EnrollmentModel from "../models/enrollment.model";
import LessonCommentModel from "../models/comment.model";
import mongoose from "mongoose";
import OrderModel from "../models/order.model";
import OrderItemModel from "../models/order_item.model";
import QuizAttemptModel from "../models/QuizAttempt.model";
import LessonModel from "../models/lesson.model";

export interface ChatContext {
  userRole: string;
  userId: string; 
  systemData?: {
    courses?: any[];
    books?: any[];
    users?: any[];
    enrollments?: any[];
    orders?: any[];
    orderItems?: any[];
    teacherStats?: any;
    teacherCourses?: any[];
    learningData?: any; // Dữ liệu học tập của học viên
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
      // Nhận diện câu hỏi về kế hoạch học tập
      const studyPlanKeywords = [
        "kế hoạch học tập",
        "lịch học",
        "học trong",
        "nên học",
        "gợi ý học",
        "kế hoạch",
        "học bao nhiêu",
        "làm quiz",
        "ôn tập",
        "củng cố kiến thức",
        "nâng cao trí nhớ",
        "học thêm bài",
        "học bài nào",
      ];
      
      const messageLower = message.toLowerCase();
      const isStudyPlanQuestion = studyPlanKeywords.some(keyword => 
        messageLower.includes(keyword)
      );

      // Nếu là câu hỏi về kế hoạch học tập, tự động tạo kế hoạch chi tiết
      if (isStudyPlanQuestion && context.userId && (context.userRole === "user" || !context.userRole || context.userRole === "customer")) {
        // Trích xuất số ngày từ câu hỏi (nếu có)
        const daysMatch = message.match(/(\d+)\s*(ngày|day)/i);
        const days = daysMatch ? parseInt(daysMatch[1], 10) : 7;
        const validDays = days >= 1 && days <= 90 ? days : 7;

        // Tạo kế hoạch học tập chi tiết
        const studyPlan = await this.generateStudyPlan(context.userId, validDays);
        return studyPlan;
      }

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
    } else if (userRole === "teacher") {
      basePrompt += `

Quyền teacher - bạn có thể theo dõi khóa học, học viên và doanh số.

Giới hạn nghiêm ngặt cho teacher:
- Chỉ xem dữ liệu liên quan tới các khóa học do BẠN sở hữu.
- Khi được hỏi về dữ liệu giáo viên/khóa học của người khác: từ chối lịch sự và giải thích lý do.
- Không tiết lộ thông tin nhạy cảm (email, số điện thoại, địa chỉ, token, ID nội bộ,
  mã giao dịch, chi tiết thanh toán). Chỉ cung cấp số liệu tổng quát và ẩn PII.`;

      if (systemData?.courses?.length) {
        basePrompt += `

Các khóa học của bạn:
${systemData.courses
  .map((c: any) => `- ${c.title} (Slug: ${c.slug})`)
  .join("\n")}`;
      }

      if (Array.isArray(systemData?.orderItems) && systemData.orderItems.length) {
        const completed = systemData.orderItems.filter((it: any) => it.order_status === "completed");
        const pending = systemData.orderItems.filter((it: any) => it.order_status === "pending");
        const revenue = completed.reduce((sum: number, it: any) => sum + (it.price_at_purchase || 0) * (it.quantity || 1), 0);

        basePrompt += `

Tổng quan doanh số gần đây:
- Đơn hoàn tất: ${completed.length}
- Đơn đang chờ: ${pending.length}
- Doanh thu (đơn hoàn tất): ${revenue}`;

        const recentLines = systemData.orderItems.slice(0, 5).map((it: any) => {
          const amt = (it.price_at_purchase || 0) * (it.quantity || 1);
          const when = it.order_paid_at || it.order_created_at || it.created_at || "";
          const whenStr = when ? new Date(when).toISOString() : "";
          return `• ${it.order_status?.toUpperCase() || "UNKNOWN"} - ${amt} @ ${whenStr}`;
        });
        if (recentLines.length) {
          basePrompt += `

Giao dịch gần đây:
${recentLines.join("\n")}`;
        }
      }

      if (systemData?.teacherStats) {
        basePrompt += `

Thống kê nhanh:
${JSON.stringify(systemData.teacherStats, null, 2)}`;
      }
      if (systemData?.teacherCourses?.length) {
        basePrompt += `

Một số khóa học (teacherCourses):
${systemData.teacherCourses.map((c: any) => `- ${c.title} (Slug: ${c.slug})`).join("\n")}`;
      }
    } else {
      basePrompt += `

Quyền khách hàng - Bạn có thể:
- Giới thiệu khóa học phù hợp.
- Gợi ý sách hỗ trợ học tập.
- Trả lời câu hỏi về nội dung học.
- Hướng dẫn sử dụng hệ thống.
- Tư vấn và tạo kế hoạch học tập cá nhân hóa dựa trên tiến độ học tập hiện tại.

Không cung cấp thông tin nhạy cảm về hệ thống hoặc người dùng khác.`;

      // Thêm thông tin học tập của học viên nếu có
      if (systemData?.learningData) {
        const ld = systemData.learningData;
        basePrompt += `

THÔNG TIN HỌC TẬP CỦA HỌC VIÊN:
- Tổng số khóa học đã đăng ký: ${ld.totalCourses}
- Số quiz đã hoàn thành: ${ld.quizStats.totalQuizzes}
- Tỷ lệ đúng quiz: ${ld.quizStats.successRate}%
- Điểm trung bình quiz: ${ld.quizStats.averageScore}%
- Số quiz trong 30 ngày gần đây: ${ld.quizStats.recentQuizCount}
- Số bài học đã hoàn thành: ${ld.lessonStats.totalCompletedLessons} / ${ld.lessonStats.totalLessons}
- Số bài học còn lại: ${ld.lessonStats.remainingLessons}

CHI TIẾT CÁC KHÓA HỌC:
${ld.enrollments.map((e: any, idx: number) => 
  `${idx + 1}. ${e.courseTitle} - Tiến độ: ${e.progress}% - Đã hoàn thành ${e.completedLessons} bài học`
).join('\n')}

KHI HỌC VIÊN HỎI VỀ KẾ HOẠCH HỌC TẬP:
- Phân tích tình hình học tập hiện tại và đưa ra đánh giá ngắn gọn
- Đề xuất số lần làm quiz để nâng cao trí nhớ và củng cố kiến thức (dựa trên spaced repetition)
- Đề xuất số bài học (lessons) nên học thêm
- Gợi ý các khóa học cần ưu tiên dựa trên tiến độ
- Động viên và khuyến khích học viên
- Kế hoạch phải thực tế và có thể thực hiện được
- Phân bổ thời gian hợp lý, không quá tải`;

        // Nếu có khóa học với tiến độ thấp, gợi ý ưu tiên
        const lowProgressCourses = ld.enrollments.filter((e: any) => e.progress < 50 && e.progress > 0);
        if (lowProgressCourses.length > 0) {
          basePrompt += `

CÁC KHÓA HỌC CẦN ƯU TIÊN (tiến độ < 50%):
${lowProgressCourses.map((e: any) => `- ${e.courseTitle}: ${e.progress}% - Còn ${e.completedLessons} bài học đã hoàn thành`).join('\n')}`;
        }
      }

      if (systemData?.courses?.length) {
        basePrompt += `

Khóa học có sẵn:
${systemData.courses
  .map((c: any) => `- ${c.title} (Slug: ${c.slug}): ${c.short_desc || c.description || ""} - Giá: ${c.price || 0}₫`)
  .join("\n")}`;
      }
      if (systemData?.books?.length) {
        basePrompt += `

Sách có sẵn:
${systemData.books
  .map((b: any) => `- ${b.title} (Slug: ${b.slug}) (${b.author || ""}): ${b.description || ""} - Giá: ${b.price || 0}₫`)
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

  async getSystemData(userRole: string, userId?: string): Promise<any> {
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

  // Additive helper for teacher-specific data without changing old logic
  async getTeacherSystemData(userId: string): Promise<any> {
    try {
      const data: any = {};
      const teacherObjectId = new mongoose.Types.ObjectId(userId);

      const teacherCourses = await CourseModel.find({ teacher: teacherObjectId })
        .select("title slug status is_published price created_at description")
        .sort({ created_at: -1 })
        .limit(20);
      data.courses = teacherCourses;
      data.teacherCourses = teacherCourses;

      const courseIds = teacherCourses.map((c) => c._id);
      if (!courseIds.length) {
        data.enrollments = [];
        data.orderItems = [];
        data.teacherStats = {
          totalCourses: 0,
          publishedCourses: 0,
          pendingCourses: 0,
          totalEnrollments: 0,
          activeEnrollments: 0,
          openComments: 0,
        };
        return data;
      }

      data.enrollments = await EnrollmentModel.find({ course_id: { $in: courseIds } })
        .select("course_id user_id status created_at")
        .sort({ created_at: -1 })
        .limit(20);

      data.orderItems = await OrderItemModel.aggregate([
        { $match: { product_type: "Course", product_id: { $in: courseIds } } },
        { $lookup: { from: "orders", localField: "order_id", foreignField: "_id", as: "order" } },
        { $unwind: "$order" },
        { $sort: { "order.created_at": -1 } },
        { $limit: 50 },
        { $project: {
            _id: 1,
            product_id: 1,
            product_type: 1,
            price_at_purchase: 1,
            quantity: 1,
            created_at: 1,
            order_status: "$order.status",
            order_paid_at: "$order.paid_at",
            order_created_at: "$order.created_at",
        }},
      ]);

      const [
        totalCourses,
        publishedCourses,
        pendingCourses,
        totalEnrollments,
        activeEnrollments,
        openComments,
      ] = await Promise.all([
        CourseModel.countDocuments({ teacher: teacherObjectId }),
        CourseModel.countDocuments({ teacher: teacherObjectId, is_published: true }),
        CourseModel.countDocuments({ teacher: teacherObjectId, status: "pending" }),
        EnrollmentModel.countDocuments({ course_id: { $in: courseIds } }),
        EnrollmentModel.countDocuments({ course_id: { $in: courseIds }, status: "active" }),
        LessonCommentModel.countDocuments({ course_id: { $in: courseIds }, status: "open" }),
      ]);

      data.teacherStats = {
        totalCourses,
        publishedCourses,
        pendingCourses,
        totalEnrollments,
        activeEnrollments,
        openComments,
      };

      return data;
    } catch (error) {
      console.error("Error fetching teacher system data:", error);
      return {};
    }
  }

  /**
   * Lấy dữ liệu học tập của học viên để phân tích và đưa ra kế hoạch học tập
   */
  async getStudentLearningData(userId: string): Promise<any> {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Lấy tất cả enrollments của học viên
      const enrollments = await EnrollmentModel.find({ user_id: userObjectId })
        .populate("course_id", "title slug")
        .lean();

      const courseIds = enrollments.map((e: any) => e.course_id?._id || e.course_id).filter(Boolean);

      // Lấy tất cả quiz attempts đã hoàn thành
      const quizAttempts = await QuizAttemptModel.find({
        user_id: userObjectId,
        completed: true,
      })
        .sort({ created_at: -1 })
        .lean();

      // Tính toán thống kê quiz
      const totalQuizzes = quizAttempts.length;
      let totalCorrect = 0;
      let totalAnswers = 0;
      let totalScore = 0;

      quizAttempts.forEach((attempt: any) => {
        if (attempt.correct !== undefined && attempt.total !== undefined) {
          totalCorrect += attempt.correct;
          totalAnswers += attempt.total;
        }
        if (attempt.score !== undefined) {
          totalScore += attempt.score;
        }
      });

      const averageScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;
      const successRate = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;

      // Lấy số lượng lessons đã hoàn thành
      let totalCompletedLessons = 0;
      let totalLessons = 0;

      for (const enrollment of enrollments) {
        const courseId = (enrollment as any).course_id?._id || (enrollment as any).course_id;
        if (courseId) {
          const courseObjectId = new mongoose.Types.ObjectId(courseId);
          const completedCount = (enrollment as any).completed_lessons?.length || 0;
          const totalCount = await LessonModel.countDocuments({ course_id: courseObjectId });
          totalCompletedLessons += completedCount;
          totalLessons += totalCount;
        }
      }

      // Lấy quiz attempts trong 30 ngày gần đây để phân tích tần suất
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentQuizAttempts = quizAttempts.filter((attempt: any) => {
        const createdAt = attempt.created_at || attempt.createdAt;
        return createdAt && new Date(createdAt) >= thirtyDaysAgo;
      });

      return {
        enrollments: enrollments.map((e: any) => ({
          courseTitle: e.course_id?.title || "Khóa học không xác định",
          courseSlug: e.course_id?.slug || "",
          progress: e.progress || 0,
          completedLessons: e.completed_lessons?.length || 0,
        })),
        quizStats: {
          totalQuizzes,
          totalCorrect,
          totalAnswers,
          successRate,
          averageScore,
          recentQuizCount: recentQuizAttempts.length, // Số quiz trong 30 ngày gần đây
        },
        lessonStats: {
          totalCompletedLessons,
          totalLessons,
          remainingLessons: totalLessons - totalCompletedLessons,
        },
        totalCourses: enrollments.length,
      };
    } catch (error) {
      console.error("Error fetching student learning data:", error);
      return {
        enrollments: [],
        quizStats: {
          totalQuizzes: 0,
          totalCorrect: 0,
          totalAnswers: 0,
          successRate: 0,
          averageScore: 0,
          recentQuizCount: 0,
        },
        lessonStats: {
          totalCompletedLessons: 0,
          totalLessons: 0,
          remainingLessons: 0,
        },
        totalCourses: 0,
      };
    }
  }

  /**
   * Tạo kế hoạch học tập trong n ngày với gợi ý về quiz và lessons
   * @param userId - ID của học viên
   * @param days - Số ngày cho kế hoạch học tập (mặc định 7 ngày)
   * @returns Kế hoạch học tập được tạo bởi AI
   */
  async generateStudyPlan(userId: string, days: number = 7): Promise<string> {
    try {
      // Lấy dữ liệu học tập của học viên
      const learningData = await this.getStudentLearningData(userId);

      // Xây dựng prompt cho AI
      const prompt = `Bạn là ViceduAI, trợ lý AI thông minh của VicEdu. Nhiệm vụ của bạn là tạo một kế hoạch học tập chi tiết và cá nhân hóa cho học viên trong ${days} ngày tới.

THÔNG TIN HỌC TẬP HIỆN TẠI CỦA HỌC VIÊN:
- Tổng số khóa học đã đăng ký: ${learningData.totalCourses}
- Số quiz đã hoàn thành: ${learningData.quizStats.totalQuizzes}
- Tỷ lệ đúng quiz: ${learningData.quizStats.successRate}%
- Điểm trung bình quiz: ${learningData.quizStats.averageScore}%
- Số quiz trong 30 ngày gần đây: ${learningData.quizStats.recentQuizCount}
- Số bài học đã hoàn thành: ${learningData.lessonStats.totalCompletedLessons} / ${learningData.lessonStats.totalLessons}
- Số bài học còn lại: ${learningData.lessonStats.remainingLessons}

CHI TIẾT CÁC KHÓA HỌC:
${learningData.enrollments.map((e: any, idx: number) => 
  `${idx + 1}. ${e.courseTitle} - Tiến độ: ${e.progress}% - Đã hoàn thành ${e.completedLessons} bài học`
).join('\n')}

YÊU CẦU KẾ HOẠCH HỌC TẬP:
1. Phân tích tình hình học tập hiện tại và đưa ra đánh giá ngắn gọn
2. Đề xuất số lần làm quiz trong ${days} ngày để nâng cao trí nhớ và củng cố kiến thức (dựa trên tần suất hiện tại và mục tiêu cải thiện)
3. Đề xuất số bài học (lessons) nên học thêm trong ${days} ngày (phân bổ hợp lý theo tiến độ hiện tại)
4. Đưa ra lịch trình học tập cụ thể từng ngày (nếu có thể)
5. Gợi ý các khóa học cần ưu tiên dựa trên tiến độ
6. Động viên và khuyến khích học viên

LƯU Ý:
- Kế hoạch phải thực tế và có thể thực hiện được
- Phân bổ thời gian hợp lý, không quá tải
- Ưu tiên các khóa học có tiến độ thấp hoặc chưa hoàn thành
- Gợi ý số lần quiz dựa trên nghiên cứu về spaced repetition (lặp lại ngắt quãng) để tăng cường trí nhớ
- Sử dụng ngôn ngữ thân thiện, động viên và có cảm xúc
- Trả lời bằng tiếng Việt

Hãy tạo kế hoạch học tập chi tiết và hấp dẫn!`;

      const response: any = await (this.ai as any).models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      return response?.text || response?.response?.text || "Xin lỗi, tôi không thể tạo kế hoạch học tập lúc này. Vui lòng thử lại sau.";
    } catch (error) {
      console.error("Gemini generateStudyPlan error:", error);
      return "Xin lỗi, có lỗi xảy ra khi tạo kế hoạch học tập. Vui lòng thử lại sau.";
    }
  }
}
