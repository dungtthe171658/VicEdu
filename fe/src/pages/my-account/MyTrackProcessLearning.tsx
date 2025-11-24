import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import enrollmentApi from "../../api/enrollmentApi";
import bookApi from "../../api/bookApi";
import quizApi from "../../api/quizApi";
import axios from "../../api/axios";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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
      _id?: string;
      title: string;
      course_id?: {
        _id?: string;
        title: string;
        slug: string;
      } | string;
    } | string;
  };
}

interface CourseWithProgress {
  _id: string;
  title: string;
  progress: number;
}

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
  const [coursesWithProgress, setCoursesWithProgress] = useState<CourseWithProgress[]>([]);
  const [dailyStats, setDailyStats] = useState<Array<{ date: string; lessons: number; quizzes: number }>>([]);
  const [startDate, setStartDate] = useState<string>("2025-11-21");
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");

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

        // Fetch courses with progress for bar chart (include all courses, even not started)
        const coursesData = await Promise.all(
          (Array.isArray(enrollments) ? enrollments : []).map(async (enrollment: any): Promise<CourseWithProgress | null> => {
            try {
              const courseId = typeof enrollment.course_id === 'object' 
                ? enrollment.course_id?._id || enrollment.course_id 
                : enrollment.course_id;
              if (courseId) {
                const enrollmentDetail = await enrollmentApi.getEnrollmentByCourse(courseId);
                const progress = enrollmentDetail.progress || 0;
                
                try {
                  const courseRes = await axios.get(`/courses/id/${courseId}`);
                  const courseData = (courseRes as any).data || courseRes;
                  return {
                    _id: courseId,
                    title: courseData.title || "Khóa học không xác định",
                    progress: progress,
                  };
                } catch {
                  return null;
                }
              }
              return null;
            } catch {
              return null;
            }
          })
        );
        const validCourses = coursesData
          .filter((c): c is CourseWithProgress => c !== null)
          .sort((a, b) => b.progress - a.progress); // Sort by progress descending
        setCoursesWithProgress(validCourses);

        // Fetch purchased books from bookHistory (same as MyBooksPage.tsx)
        const booksRes = await bookApi.getMyBooksFromHistory();
        const payload = booksRes?.data as any;
        const books = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
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

  // Separate useEffect for daily stats to optimize re-fetching when date range changes
  useEffect(() => {
    const fetchDailyStats = async () => {
      try {
        const dailyData = await enrollmentApi.getDailyLearningStats(startDate, endDate);
        const statsArray = Array.isArray(dailyData) ? dailyData : [];
        console.log("Daily stats data:", statsArray);
        setDailyStats(statsArray);
      } catch (error) {
        console.error("Failed to fetch daily stats:", error);
        setDailyStats([]);
      }
    };

    fetchDailyStats();
  }, [startDate, endDate]);

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

  // Get bar color based on progress
  const getBarColor = (progress: number) => {
    if (progress === 0) return "#9CA3AF"; // Gray for not started
    if (progress < 30) return "#EF4444"; // Red for low progress
    if (progress < 60) return "#F59E0B"; // Orange for medium progress
    if (progress < 100) return "#10B981"; // Green for good progress
    return "#059669"; // Dark green for completed
  };

  // Get progress status text
  const getProgressStatus = (progress: number) => {
    if (progress === 0) return "Chưa bắt đầu";
    if (progress < 30) return "Mới bắt đầu";
    if (progress < 60) return "Đang học";
    if (progress < 100) return "Gần hoàn thành";
    return "Đã hoàn thành";
  };

  // Extract unique courses from quiz history (only from purchased courses)
  const getAvailableCourses = () => {
    const enrolledCourseIds = new Set(coursesWithProgress.map(c => c._id));
    const courseMap = new Map<string, { id: string; title: string }>();
    
    quizHistory.forEach(attempt => {
      if (!attempt.quiz?.lesson_id) return;
      
      const lessonId = attempt.quiz.lesson_id;
      const courseIdObj = typeof lessonId === 'object' ? lessonId.course_id : null;
      const courseId = (typeof courseIdObj === 'object' && courseIdObj?._id) 
                      || (typeof courseIdObj === 'string' ? courseIdObj : null)
                      || (typeof courseIdObj === 'object' && courseIdObj ? String(courseIdObj) : null);
      const courseTitle = (typeof courseIdObj === 'object' && courseIdObj?.title) || "";
      
      if (courseId && courseTitle && enrolledCourseIds.has(courseId)) {
        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, { id: courseId, title: courseTitle });
        }
      }
    });
    
    return Array.from(courseMap.values());
  };

  // Extract unique lessons from quiz history (filtered by selected course)
  const getAvailableLessons = () => {
    if (!selectedCourseId) return [];
    
    const lessonMap = new Map<string, { id: string; title: string }>();
    
    quizHistory.forEach(attempt => {
      if (!attempt.quiz?.lesson_id) return;
      
      const lessonId = attempt.quiz.lesson_id;
      const lessonIdStr = (typeof lessonId === 'object' && lessonId._id) 
                        || (typeof lessonId === 'string' ? lessonId : null);
      const lessonTitle = (typeof lessonId === 'object' && lessonId.title) || "";
      
      const courseIdObj = typeof lessonId === 'object' ? lessonId.course_id : null;
      const courseId = (typeof courseIdObj === 'object' && courseIdObj?._id) 
                      || (typeof courseIdObj === 'string' ? courseIdObj : null);
      
      if (courseId === selectedCourseId && lessonIdStr && lessonTitle) {
        if (!lessonMap.has(lessonIdStr)) {
          lessonMap.set(lessonIdStr, { id: lessonIdStr, title: lessonTitle });
        }
      }
    });
    
    return Array.from(lessonMap.values());
  };

  // Filter quiz history based on selected course and lesson
  const filteredQuizHistory = quizHistory.filter(attempt => {
    if (!attempt.quiz?.lesson_id) return false;
    
    const lessonId = attempt.quiz.lesson_id;
    const lessonIdStr = (typeof lessonId === 'object' && lessonId._id) 
                      || (typeof lessonId === 'string' ? lessonId : null);
    
    const courseIdObj = typeof lessonId === 'object' ? lessonId.course_id : null;
    const courseId = (typeof courseIdObj === 'object' && courseIdObj?._id) 
                    || (typeof courseIdObj === 'string' ? courseIdObj : null);
    
    // Only show quizzes from purchased courses
    const enrolledCourseIds = new Set(coursesWithProgress.map(c => c._id));
    if (courseId && !enrolledCourseIds.has(courseId)) {
      return false;
    }
    
    // Filter by selected course
    if (selectedCourseId && courseId !== selectedCourseId) {
      return false;
    }
    
    // Filter by selected lesson
    if (selectedLessonId && lessonIdStr !== selectedLessonId) {
      return false;
    }
    
    return true;
  });

  // Reset lesson filter when course changes
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedLessonId(""); // Reset lesson filter
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
              <p className="text-sm text-gray-600">Sách đã mua</p>
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
              <div className="flex items-center gap-6">
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
              <div className="flex items-center gap-6">
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

            {/* Books Purchased Card */}
            <div className="bg-blue-50 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                  <FaBook className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sách đã mua</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.totalBooksRead}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Progress Bar Chart */}
          {coursesWithProgress.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Tiến độ các khóa học
                </h3>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-400"></div>
                    <span className="text-gray-600">Chưa bắt đầu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span className="text-gray-600">0-30%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-amber-500"></div>
                    <span className="text-gray-600">30-60%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span className="text-gray-600">60-100%</span>
                  </div>
                </div>
              </div>
              <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={coursesWithProgress.map((course) => ({
                      name: course.title.length > 25 
                        ? course.title.substring(0, 25) + "..." 
                        : course.title,
                      fullName: course.title,
                      "Tiến độ (%)": course.progress,
                      color: getBarColor(course.progress),
                      status: getProgressStatus(course.progress),
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={120}
                      interval={0}
                      tick={{ fontSize: 11, fill: "#000000" }}
                      stroke="#9CA3AF"
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      stroke="#9CA3AF"
                      label={{ 
                        value: 'Tiến độ (%)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#374151', fontSize: 14, fontWeight: 600 }
                      }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as any;
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                              <p className="font-semibold text-gray-800 mb-1">{data.fullName}</p>
                              <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Tiến độ: </span>
                                <span className="font-bold" style={{ color: data.color }}>
                                  {data["Tiến độ (%)"]}%
                                </span>
                              </p>
                              <p className="text-xs text-gray-500">{data.status}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="Tiến độ (%)" 
                      radius={[6, 6, 0, 0]}
                      animationDuration={1000}
                    >
                      {coursesWithProgress.map((course, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(course.progress)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Daily Learning Stats Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Thống kê học tập theo ngày
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span className="text-gray-600">Bài học hoàn thành</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span className="text-gray-600">Quiz đã làm</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Date Range Selector */}
            <div className="mb-4 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                  Từ ngày:
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
                  Đến ngày:
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => {
                  setStartDate("2025-11-21");
                  setEndDate(new Date().toISOString().split('T')[0]);
                }}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Đặt lại
              </button>
            </div>
            {dailyStats.length > 0 ? (
              <div className="w-full" style={{ minHeight: '384px', height: '384px' }}>
                <ResponsiveContainer width="100%" height={384}>
                  <BarChart
                    data={dailyStats.map((stat) => ({
                      date: new Date(stat.date).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                      }),
                      fullDate: stat.date,
                      "Bài học": stat.lessons,
                      "Quiz": stat.quizzes,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tick={{ fontSize: 11, fill: "#6B7280" }}
                      stroke="#9CA3AF"
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      stroke="#9CA3AF"
                      label={{ 
                        value: 'Số lần', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#374151', fontSize: 14, fontWeight: 600 }
                      }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as any;
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                              <p className="font-semibold text-gray-800 mb-2">
                                {new Date(data.fullDate).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </p>
                              <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Bài học: </span>
                                <span className="font-bold text-blue-600">
                                  {data["Bài học"]}
                                </span>
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Quiz: </span>
                                <span className="font-bold text-purple-600">
                                  {data["Quiz"]}
                                </span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="Bài học" 
                      fill="#3B82F6"
                      radius={[6, 6, 0, 0]}
                      animationDuration={1000}
                    />
                    <Bar 
                      dataKey="Quiz" 
                      fill="#8B5CF6"
                      radius={[6, 6, 0, 0]}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12">
                <FaChartBar className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500 mb-2">Chưa có dữ liệu học tập theo ngày</p>
                <p className="text-sm text-gray-400">
                  Dữ liệu sẽ được hiển thị sau khi bạn hoàn thành bài học hoặc làm quiz
                </p>
              </div>
            )}
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Lịch sử chơi Quiz</h3>
                <span className="text-sm text-gray-500">
                  {filteredQuizHistory.length} / {quizHistory.length} {quizHistory.length === 1 ? "Quiz" : "Quiz"}
                </span>
              </div>

              {/* Filter Section */}
              <div className="mb-4 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label htmlFor="courseFilter" className="text-sm font-medium text-gray-700">
                    Khóa học:
                  </label>
                  <select
                    id="courseFilter"
                    value={selectedCourseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[200px]"
                  >
                    <option value="">Tất cả khóa học</option>
                    {getAvailableCourses().map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedCourseId && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="lessonFilter" className="text-sm font-medium text-gray-700">
                      Bài học:
                    </label>
                    <select
                      id="lessonFilter"
                      value={selectedLessonId}
                      onChange={(e) => setSelectedLessonId(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[200px]"
                    >
                      <option value="">Tất cả bài học</option>
                      {getAvailableLessons().map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {(selectedCourseId || selectedLessonId) && (
                  <button
                    onClick={() => {
                      setSelectedCourseId("");
                      setSelectedLessonId("");
                    }}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
              
              {filteredQuizHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FaCheckCircle className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">
                    {quizHistory.length === 0 
                      ? "Chưa có lịch sử làm quiz" 
                      : "Không có quiz nào khớp với bộ lọc"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {filteredQuizHistory.map((attempt) => {
                    const quizTitle = attempt.quiz?.title || "Quiz không xác định";
                    const lessonId = attempt.quiz?.lesson_id;
                    const lessonTitle = (typeof lessonId === 'object' && lessonId?.title) || "";
                    const courseIdObj = (typeof lessonId === 'object' && lessonId?.course_id) || null;
                    const courseTitle = (typeof courseIdObj === 'object' && courseIdObj?.title) || "";
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

