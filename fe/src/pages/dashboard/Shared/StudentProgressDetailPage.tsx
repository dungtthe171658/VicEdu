import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import enrollmentApi from "../../../api/enrollmentApi";
import userApi from "../../../api/userApi";
import quizApi from "../../../api/quizApi";
import bookApi from "../../../api/bookApi";
import {
  FaBook,
  FaChartBar,
  FaBookOpen,
  FaCheckCircle,
  FaChartLine,
  FaArrowLeft,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Button, Box, CircularProgress } from "@mui/material";

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


export default function StudentProgressDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
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

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;
      
      setLoading(true);
      try {
        // Fetch student info
        const studentRes = await userApi.getById(studentId);
        const studentData = studentRes?.data || studentRes;
        setStudent(studentData);

        // Fetch enrollments for this student (filter from admin endpoint)
        const allEnrollments = await enrollmentApi.getAllForAdmin();
        const studentEnrollments = Array.isArray(allEnrollments)
          ? allEnrollments.filter((e: any) => {
              const userId = typeof e.user_id === 'object' ? e.user_id?._id || e.user_id : e.user_id;
              return String(userId) === String(studentId);
            })
          : [];
        const coursesCount = studentEnrollments.length;

        // Calculate average progress from enrollments
        let totalProgress = 0;
        const enrollmentsWithProgress = await Promise.all(
          studentEnrollments.map(async (enrollment: any) => {
            try {
              const courseId = typeof enrollment.course_id === 'object' 
                ? enrollment.course_id?._id || enrollment.course_id 
                : enrollment.course_id;
              if (courseId) {
                // For admin view, we can get progress directly from enrollment object
                return enrollment.progress || 0;
              }
              return 0;
            } catch {
              return 0;
            }
          })
        );
        totalProgress = enrollmentsWithProgress.reduce((sum, p) => sum + p, 0);
        const averagePoints = coursesCount > 0 ? Math.round(totalProgress / coursesCount) : 0;

        // Fetch purchased books count from bookHistory
        let totalBooksRead = 0;
        try {
          const booksRes = await bookApi.getPurchasedBookCountByUserId(studentId);
          const booksData = booksRes?.data as any;
          totalBooksRead = booksData?.count || 0;
        } catch (error) {
          console.error("Error fetching books count:", error);
        }

        const booksByLevel = {
          starter: 0,
          level1: 0,
          level2: 0,
        };

        // Fetch real quiz attempts for this student
        const quizAttempts = await quizApi.getAttemptsByUserForAdmin(studentId);
        const attempts = Array.isArray(quizAttempts) ? quizAttempts : [];

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
          totalBooksRead,
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
  }, [studentId]);

  const quizData = [
    { name: "Success", value: stats.quizStats.successRate, color: "#8B5CF6" },
    { name: "Remaining", value: 100 - stats.quizStats.successRate, color: "#E5E7EB" },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
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
              {student?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <h3 className="text-center font-semibold text-gray-800">{student?.name || "Học sinh"}</h3>
            <p className="text-center text-sm text-gray-500">{student?.email || ""}</p>
          </div>

          {/* Back Button */}
          <Button
            variant="outlined"
            startIcon={<FaArrowLeft />}
            onClick={() => navigate(-1)}
            fullWidth
            sx={{ mb: 2 }}
          >
            Quay lại
          </Button>

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
              Bảng điều khiển của {student?.name || "học sinh"}
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

            {/* Books Purchased Card */}
            <div className="bg-blue-50 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
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

          {/* Quiz Success Rate */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
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
          </div>
        </main>
      </div>
    </div>
  );
}

