import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import enrollmentApi from "../../api/enrollmentApi";
import bookApi from "../../api/bookApi";
import quizApi from "../../api/quizApi";
import {
  FaBook,
  FaChartBar,
  FaBookOpen,
  FaCheckCircle,
  FaChartLine,
  FaTrash,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

interface LearningStats {
  totalCourses: number;
  averagePoints: number;
  totalBooksRead: number;
  booksByLevel: {
    starter: number;
    level1: number;
    level2: number;
  };
  quizStats: {
    totalQuizzes: number;
    correctAnswers: number;
    totalAnswers: number;
    successRate: number;
    averageScore: number;
  };
}

interface QuizAttemptHistory {
  _id: string;
  quiz_id: string;
  completed: boolean;
  correct: number;
  total: number;
  score: number;
  spent_seconds: number;
  violations: number;
  created_at?: string;
  quiz?: {
    _id: string;
    title: string;
    lesson_id?: {
      title: string;
      course_id?: {
        title: string;
        slug: string;
      };
    };
  };
}

const COLORS = {
  starter: "#FF6B9D", // Pink
  level1: "#10B981", // Green
  level2: "#8B5CF6", // Purple
};

export default function MyTrackProcessLearning() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LearningStats>({
    totalCourses: 0,
    averagePoints: 0,
    totalBooksRead: 0,
    booksByLevel: {
      starter: 0,
      level1: 0,
      level2: 0,
    },
    quizStats: {
      totalQuizzes: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      successRate: 0,
      averageScore: 0,
    },
  });
  const [quizHistory, setQuizHistory] = useState<QuizAttemptHistory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch enrollments
        const enrollments = await enrollmentApi.getMyEnrollMini();
        const coursesCount = Array.isArray(enrollments) ? enrollments.length : 0;

        // Calculate average progress from enrollments
        let totalProgress = 0;
        const enrollmentsWithProgress = await Promise.all(
          (Array.isArray(enrollments) ? enrollments : []).map(async (enrollment: any) => {
            try {
              const courseId = typeof enrollment.course_id === 'object' 
                ? enrollment.course_id?._id || enrollment.course_id 
                : enrollment.course_id;
              if (courseId) {
                const enrollmentDetail = await enrollmentApi.getEnrollmentByCourse(courseId);
                return enrollmentDetail.progress || 0;
              }
              return 0;
            } catch {
              return 0;
            }
          })
        );
        totalProgress = enrollmentsWithProgress.reduce((sum, p) => sum + p, 0);
        const averagePoints = coursesCount > 0 ? Math.round(totalProgress / coursesCount) : 0;

        // Fetch purchased books
        const booksRes = await bookApi.getPurchasedBooks();
        const books = Array.isArray(booksRes?.data)
          ? booksRes.data
          : Array.isArray(booksRes?.data?.data)
          ? booksRes.data.data
          : [];

        // Calculate books by level
        const booksByLevel = {
          starter: books.filter((b: any) => b.level === "Starter" || !b.level).length,
          level1: books.filter((b: any) => b.level === "Level 1" || b.level === "1").length,
          level2: books.filter((b: any) => b.level === "Level 2" || b.level === "2").length,
        };

        // Fetch real quiz attempts
        const quizAttempts = await quizApi.getMyAttempts();
        const attempts = Array.isArray(quizAttempts) ? quizAttempts : [];

        // Store quiz history
        setQuizHistory(attempts as QuizAttemptHistory[]);

        // Calculate quiz statistics from real data
        const completedAttempts = attempts.filter((a: any) => a.completed);
        const totalQuizzes = completedAttempts.length;
        let totalCorrect = 0;
        let totalAnswers = 0;
        let totalScore = 0;

        completedAttempts.forEach((attempt: any) => {
          if (attempt.correct !== undefined && attempt.total !== undefined) {
            totalCorrect += attempt.correct;
            totalAnswers += attempt.total;
          }
          if (attempt.score !== undefined) {
            totalScore += attempt.score;
          }
        });

        const successRate = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
        const averageScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;

        const quizStats = {
          totalQuizzes,
          correctAnswers: totalCorrect,
          totalAnswers,
          successRate,
          averageScore,
        };

        setStats({
          totalCourses: coursesCount,
          averagePoints,
          totalBooksRead: books.length,
          booksByLevel,
          quizStats,
        });
      } catch (error) {
        console.error("Failed to fetch learning progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const booksData = [
    { name: "Starter", value: stats.booksByLevel.starter, color: COLORS.starter },
    { name: "Level 1", value: stats.booksByLevel.level1, color: COLORS.level1 },
    { name: "Level 2", value: stats.booksByLevel.level2, color: COLORS.level2 },
  ].filter((item) => item.value > 0);

  const quizData = [
    { name: "Success", value: stats.quizStats.successRate, color: "#8B5CF6" },
    { name: "Remaining", value: 100 - stats.quizStats.successRate, color: "#E5E7EB" },
  ];

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format time spent
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  // Get score color based on percentage
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  // Delete attempt
  const handleDeleteAttempt = async (attemptId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lịch sử này không?")) {
      return;
    }
    
    try {
      await quizApi.deleteMyAttempt(attemptId);
      // Remove from local state
      setQuizHistory(prev => prev.filter(a => a._id !== attemptId));
      // Recalculate stats
      const updatedHistory = quizHistory.filter(a => a._id !== attemptId);
      const completedAttempts = updatedHistory.filter((a: any) => a.completed);
      const totalQuizzes = completedAttempts.length;
      let totalCorrect = 0;
      let totalAnswers = 0;
      let totalScore = 0;

      completedAttempts.forEach((attempt: any) => {
        if (attempt.correct !== undefined && attempt.total !== undefined) {
          totalCorrect += attempt.correct;
          totalAnswers += attempt.total;
        }
        if (attempt.score !== undefined) {
          totalScore += attempt.score;
        }
      });

      const successRate = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
      const averageScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;

      setStats(prev => ({
        ...prev,
        quizStats: {
          totalQuizzes,
          correctAnswers: totalCorrect,
          totalAnswers,
          successRate,
          averageScore,
        },
      }));
    } catch (error) {
      console.error("Failed to delete attempt:", error);
      alert("Không thể xóa lịch sử. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white shadow-lg min-h-screen p-6">
          {/* Profile Section */}
          <div className="mb-8">
            <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <h3 className="text-center font-semibold text-gray-800">{user?.name || "User"}</h3>
            <p className="text-center text-sm text-gray-500">Học viên</p>
          </div>

          {/* Metrics */}
          <div className="mb-8 space-y-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{stats.totalCourses}</p>
              <p className="text-sm text-gray-600">Khóa học</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{stats.quizStats.totalQuizzes}</p>
              <p className="text-sm text-gray-600">Quiz đã làm</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{stats.totalBooksRead}</p>
              <p className="text-sm text-gray-600">Sách đã đọc</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {[
              { icon: FaBook, label: "Sách" },
              { icon: FaCheckCircle, label: "Quiz" },
              { icon: FaChartLine, label: "Báo cáo" },
            ].map((item, idx) => (
              <button
                key={idx}
                className="w-full flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <item.icon className="mr-3" size={20} />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <FaChartBar className="text-white" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Bảng điều khiển của {user?.name || "bạn"}
            </h1>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Courses Card */}
            <div className="bg-green-50 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                  <FaBookOpen className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Khóa học</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalCourses}</p>
                </div>
              </div>
            </div>

            {/* Quiz Success Rate Card */}
            <div className="bg-purple-50 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                  <FaCheckCircle className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tỷ lệ đúng Quiz</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.quizStats.successRate}%
                  </p>
                </div>
              </div>
            </div>

            {/* Average Books Read Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div>
                <p className="text-sm text-gray-600 mb-4">Sách đã đọc trung bình</p>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-2 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-pink-400"></span>
                      Starter
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-green-500"></span>
                      Level 1
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-purple-500"></span>
                      Level 2
                    </span>
                  </div>
                </div>
                <div className="relative w-full h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={booksData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        dataKey="value"
                      >
                        {booksData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{stats.totalBooksRead}</p>
                      <p className="text-xs text-gray-600">sách</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Success Rate and Reading Time */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quiz Success Rate */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Tỷ lệ thành công Quiz</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {stats.quizStats.totalQuizzes.toLocaleString()} Quiz đã hoàn thành
                </p>
                <p className="text-sm text-gray-600">
                  {stats.quizStats.correctAnswers.toLocaleString()} /{" "}
                  {stats.quizStats.totalAnswers.toLocaleString()} câu trả lời đúng
                </p>
                <p className="text-sm text-gray-600">
                  Điểm trung bình: {stats.quizStats.averageScore}%
                </p>
              </div>
              <div className="relative w-full h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={quizData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {quizData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">
                      {stats.quizStats.successRate}%
                    </p>
                  </div>
                </div>
              </div>
                    </div>

            {/* Quiz History */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Lịch sử chơi Quiz</h3>
                <span className="text-sm text-gray-500">
                  {quizHistory.length} {quizHistory.length === 1 ? "Quiz" : "Quiz"}
                </span>
                  </div>
              
              {quizHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FaCheckCircle className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">Chưa có lịch sử làm quiz</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {quizHistory.map((attempt) => {
                    const quizTitle = attempt.quiz?.title || "Quiz không xác định";
                    const lessonTitle = attempt.quiz?.lesson_id?.title || "";
                    const courseTitle = attempt.quiz?.lesson_id?.course_id?.title || "";
                    const score = attempt.total > 0 ? Math.round((attempt.correct / attempt.total) * 100) : 0;
                    const isCompleted = attempt.completed;
                    
                    return (
                      <div
                        key={attempt._id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 mb-1">{quizTitle}</h4>
                            {courseTitle && (
                              <p className="text-sm text-gray-600 mb-1">
                                {courseTitle}
                                {lessonTitle && ` • ${lessonTitle}`}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              {formatDate(attempt.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(score)}`}>
                              {isCompleted ? `${score}%` : "Chưa hoàn thành"}
                            </div>
                            <button
                              onClick={() => handleDeleteAttempt(attempt._id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa lịch sử"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                        
                        {isCompleted && (
                          <>
                            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Điểm số</p>
                                <p className="text-lg font-bold text-gray-800">
                                  {attempt.correct}/{attempt.total}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Thời gian</p>
                                <p className="text-lg font-bold text-gray-800">
                                  {formatTime(attempt.spent_seconds)}
                                </p>
                </div>
                <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Vi phạm</p>
                                <p className="text-lg font-bold text-gray-800">
                                  {attempt.violations || 0}
                                </p>
                    </div>
                  </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <button
                                onClick={() => navigate(`/quiz/${attempt.quiz_id}?attemptId=${attempt._id}`)}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <FaCheckCircle size={16} />
                                Chơi lại Quiz
                              </button>
                            </div>
                          </>
                        )}
                        
                        {!isCompleted && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-yellow-600">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                <span>Đang làm dở</span>
                              </div>
                              <button
                                onClick={() => navigate(`/quiz/${attempt.quiz_id}?attemptId=${attempt._id}`)}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm"
                              >
                                <FaCheckCircle size={14} />
                                Tiếp tục
                              </button>
                </div>
              </div>
                        )}
            </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

