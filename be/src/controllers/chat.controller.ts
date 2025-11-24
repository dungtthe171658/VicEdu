import { Request, Response } from "express";
import { ChatSession, ChatMessage } from "../models/chat.model";
import { GeminiService } from "../services/gemini.service";
import UserModel from "../models/user.model";

const geminiService = new GeminiService();

export class ChatController {
  // Gửi tin nhắn và nhận phản hồi từ AI
  async sendMessage(req: Request, res: Response) {
    try {
      const { message } = req.body;
      // Lấy user từ token
      const authUser = (req as any).user as { id?: string; role?: string };
      const userId = authUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Lấy thông tin người dùng
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Tìm hoặc tạo session chat
      let session = await ChatSession.findOne({ userId, isActive: true });
      if (!session) {
        session = new ChatSession({ userId, messages: [] });
        await session.save();
      }

      // Thêm tin nhắn người dùng
      const userMessage = new ChatMessage({
        userId,
        role: "user",
        content: message.trim(),
        timestamp: new Date(),
      });

      session.messages.push(userMessage);

      // Lấy dữ liệu hệ thống dựa trên quyền
      const systemData = await geminiService.getSystemData(user.role);
      let systemDataExtra: any = {};
      if (user.role === "teacher") {
        systemDataExtra = await geminiService.getTeacherSystemData(userId);
      }

      // Nếu là học viên (user/customer), tự động lấy dữ liệu học tập để AI có thể đưa ra gợi ý
      if (user.role === "user" || !user.role || user.role === "customer") {
        try {
          const learningData = await geminiService.getStudentLearningData(userId);
          systemDataExtra.learningData = learningData;
        } catch (error) {
          console.error("Error fetching learning data for chat:", error);
          // Không throw error, chỉ log để không làm gián đoạn chat
        }
      }

      // Tạo context cho AI
      const context = {
        userRole: user.role,
        userId: userId,
        systemData: { ...(systemData || {}), ...(systemDataExtra || {}) },
      };

      // Gọi Gemini API
      const aiResponse = await geminiService.generateResponse(message, context);

      // Thêm phản hồi AI
      const aiMessage = new ChatMessage({
        userId,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      });

      session.messages.push(aiMessage);
      await session.save();

      res.json({
        success: true,
        data: {
          userMessage: {
            id: userMessage._id,
            content: userMessage.content,
            timestamp: userMessage.timestamp,
          },
          aiResponse: {
            id: aiMessage._id,
            content: aiMessage.content,
            timestamp: aiMessage.timestamp,
          },
        },
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Lấy lịch sử chat
  async getChatHistory(req: Request, res: Response) {
    try {
      const authUser = (req as any).user as { id?: string; role?: string };
      const userId = authUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const session = await ChatSession.findOne({ userId, isActive: true });

      if (!session) {
        return res.json({
          success: true,
          data: {
            messages: [],
            sessionId: null,
          },
        });
      }

      res.json({
        success: true,
        data: {
          messages: session.messages.map((msg) => ({
            id: msg._id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          })),
          sessionId: session._id,
        },
      });
    } catch (error) {
      console.error("Get chat history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Xóa toàn bộ lịch sử chat
  async clearChatHistory(req: Request, res: Response) {
    try {
      const authUser = (req as any).user as { id?: string; role?: string };
      const userId = authUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Đánh dấu session hiện tại là không hoạt động
      await ChatSession.updateMany(
        { userId, isActive: true },
        { isActive: false }
      );

      res.json({
        success: true,
        message: "Chat history cleared successfully",
      });
    } catch (error) {
      console.error("Clear chat history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Lấy tất cả session chat của người dùng (cho admin)
  async getAllSessions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (userRole !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const sessions = await ChatSession.find({ isActive: true })
        .populate("userId", "name email role")
        .sort({ updatedAt: -1 })
        .limit(50);

      res.json({
        success: true,
        data: sessions.map((session) => ({
          id: session._id,
          userId: session.userId,
          messageCount: session.messages.length,
          lastMessage:
            session.messages[session.messages.length - 1]?.content || "",
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        })),
      });
    } catch (error) {
      console.error("Get all sessions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Tạo kế hoạch học tập
  async generateStudyPlan(req: Request, res: Response) {
    try {
      const authUser = (req as any).user as { id?: string; role?: string };
      const userId = authUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Lấy số ngày từ query, mặc định là 7 ngày
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
      
      if (isNaN(days) || days < 1 || days > 90) {
        return res.status(400).json({ 
          message: "Số ngày phải là số nguyên từ 1 đến 90" 
        });
      }

      // Gọi service để tạo kế hoạch học tập
      const studyPlan = await geminiService.generateStudyPlan(userId, days);

      res.json({
        success: true,
        data: {
          studyPlan,
          days,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Generate study plan error:", error);
      res.status(500).json({ 
        message: "Có lỗi xảy ra khi tạo kế hoạch học tập. Vui lòng thử lại sau." 
      });
    }
  }

  // Lấy dữ liệu học tập của học viên (để phân tích)
  async getLearningData(req: Request, res: Response) {
    try {
      const authUser = (req as any).user as { id?: string; role?: string };
      const userId = authUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Lấy dữ liệu học tập
      const learningData = await geminiService.getStudentLearningData(userId);

      res.json({
        success: true,
        data: learningData,
      });
    } catch (error) {
      console.error("Get learning data error:", error);
      res.status(500).json({ 
        message: "Có lỗi xảy ra khi lấy dữ liệu học tập. Vui lòng thử lại sau." 
      });
    }
  }
}
