import axios from "./axios";
import { getAuthToken } from "./api.helpers";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  success: boolean;
  data: {
    userMessage: ChatMessage;
    aiResponse: ChatMessage;
  };
}

export interface ChatHistoryResponse {
  success: boolean;
  data: {
    messages: ChatMessage[];
    sessionId: string | null;
  };
}

export const chatApi = {
  // Gửi tin nhắn và nhận phản hồi từ AI
  sendMessage: async (message: string): Promise<ChatResponse> => {
    const token = getAuthToken();
    if (!token) {
      // Tạm thời cho phép test không cần đăng nhập
      console.warn("Chưa đăng nhập - sử dụng mode test");
      // throw new Error("Chưa đăng nhập. Vui lòng đăng nhập trước khi sử dụng chat.");
    }

    const response = await axios.post("/chat/send", { message });
    // axios interceptor đã trả về response.data, nên response chính là data
    return response as ChatResponse;
  },

  // Lấy lịch sử chat
  getChatHistory: async (): Promise<ChatHistoryResponse> => {
    const token = getAuthToken();
    if (!token) {
      // Tạm thời cho phép test không cần đăng nhập
      console.warn("Chưa đăng nhập - sử dụng mode test");
      // throw new Error("Chưa đăng nhập. Vui lòng đăng nhập trước khi sử dụng chat.");
    }

    const response = await axios.get("/chat/history");
    return response as ChatHistoryResponse;
  },

  // Xóa toàn bộ lịch sử chat
  clearChatHistory: async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    const token = getAuthToken();
    if (!token) {
      // Tạm thời cho phép test không cần đăng nhập
      console.warn("Chưa đăng nhập - sử dụng mode test");
      // throw new Error("Chưa đăng nhập. Vui lòng đăng nhập trước khi sử dụng chat.");
    }

    const response = await axios.delete("/chat/clear");
    return response as { success: boolean; message: string };
  },

  // Lấy tất cả session chat (chỉ admin)
  getAllSessions: async (): Promise<{ success: boolean; data: any[] }> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error(
        "Chưa đăng nhập. Vui lòng đăng nhập trước khi sử dụng chat."
      );
    }

    const response = await axios.get("/chat/sessions");
    return response as { success: boolean; data: any[] };
  },

  // Tạo kế hoạch học tập
  generateStudyPlan: async (days: number = 7): Promise<{
    success: boolean;
    data: {
      studyPlan: string;
      days: number;
      generatedAt: string;
    };
  }> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error(
        "Chưa đăng nhập. Vui lòng đăng nhập trước khi sử dụng tính năng này."
      );
    }

    const response = await axios.get(`/chat/study-plan?days=${days}`);
    return response as {
      success: boolean;
      data: {
        studyPlan: string;
        days: number;
        generatedAt: string;
      };
    };
  },

  // Lấy dữ liệu học tập của học viên
  getLearningData: async (): Promise<{
    success: boolean;
    data: {
      enrollments: Array<{
        courseTitle: string;
        courseSlug: string;
        progress: number;
        completedLessons: number;
      }>;
      quizStats: {
        totalQuizzes: number;
        totalCorrect: number;
        totalAnswers: number;
        successRate: number;
        averageScore: number;
        recentQuizCount: number;
      };
      lessonStats: {
        totalCompletedLessons: number;
        totalLessons: number;
        remainingLessons: number;
      };
      totalCourses: number;
    };
  }> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error(
        "Chưa đăng nhập. Vui lòng đăng nhập trước khi sử dụng tính năng này."
      );
    }

    const response = await axios.get("/chat/learning-data");
    return response as {
      success: boolean;
      data: {
        enrollments: Array<{
          courseTitle: string;
          courseSlug: string;
          progress: number;
          completedLessons: number;
        }>;
        quizStats: {
          totalQuizzes: number;
          totalCorrect: number;
          totalAnswers: number;
          successRate: number;
          averageScore: number;
          recentQuizCount: number;
        };
        lessonStats: {
          totalCompletedLessons: number;
          totalLessons: number;
          remainingLessons: number;
        };
        totalCourses: number;
      };
    };
  },
};
