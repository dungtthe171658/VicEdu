import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import enrollmentApi from "../../api/enrollmentApi";
import bookApi from "../../api/bookApi";
import {
  FaBook,
  FaGraduationCap,
  FaChartBar,
  FaBookOpen,
  FaSchool,
  FaUsers,
  FaClipboardList,
  FaBox,
  FaCheckCircle,
  FaChartLine,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LearningStats {
  totalCourses: number;
  totalStudents: number; // For display purposes
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
    comprehension: number;
    grammar: number;
    vocabulary: number;
  };
  readingTime: {
    week: Array<{ week: string; myAverage: number; schoolAverage: number }>;
    month: Array<{ month: string; myAverage: number; schoolAverage: number }>;
    year: Array<{ year: string; myAverage: number; schoolAverage: number }>;
  };
}

const COLORS = {
  starter: "#FF6B9D", // Pink
  level1: "#10B981", // Green
  level2: "#8B5CF6", // Purple
  comprehension: "#3B82F6", // Light blue
  grammar: "#F97316", // Orange
  vocabulary: "#EF4444", // Red
};

export default function MyTrackProcessLearning() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");
  const [stats, setStats] = useState<LearningStats>({
    totalCourses: 0,
    totalStudents: 0,
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
      comprehension: 0,
      grammar: 0,
      vocabulary: 0,
    },
    readingTime: {
      week: [],
      month: [],
      year: [],
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch enrollments
        const enrollments = await enrollmentApi.getMyEnrollMini();
        const coursesCount = Array.isArray(enrollments) ? enrollments.length : 0;

        // Fetch purchased books
        const booksRes = await bookApi.getPurchasedBooks();
        const books = Array.isArray(booksRes?.data)
          ? booksRes.data
          : Array.isArray(booksRes?.data?.data)
          ? booksRes.data.data
          : [];

        // Calculate books by level (mock data for now)
        const booksByLevel = {
          starter: books.filter((b: any) => b.level === "Starter" || !b.level).length,
          level1: books.filter((b: any) => b.level === "Level 1" || b.level === "1").length,
          level2: books.filter((b: any) => b.level === "Level 2" || b.level === "2").length,
        };

        // Mock quiz stats (in real app, fetch from quiz API)
        const quizStats = {
          totalQuizzes: 2664,
          correctAnswers: 24685,
          totalAnswers: 28627,
          successRate: 86,
          comprehension: 86,
          grammar: 87,
          vocabulary: 86,
        };

        // Mock reading time data
        const generateWeekData = () => {
          const weeks = [];
          for (let i = 49; i >= 21; i--) {
            weeks.push({
              week: `Week ${i}`,
              myAverage: Math.floor(Math.random() * 30) + 10,
              schoolAverage: Math.floor(Math.random() * 20) + 15,
            });
          }
          return weeks;
        };

        const generateMonthData = () => {
          const months = [];
          for (let i = 1; i <= 12; i++) {
            months.push({
              month: `Tháng ${i}`,
              myAverage: Math.floor(Math.random() * 40) + 20,
              schoolAverage: Math.floor(Math.random() * 30) + 25,
            });
          }
          return months;
        };

        const generateYearData = () => {
          const years = [];
          for (let i = 2020; i <= 2024; i++) {
            years.push({
              year: `${i}`,
              myAverage: Math.floor(Math.random() * 50) + 30,
              schoolAverage: Math.floor(Math.random() * 40) + 35,
            });
          }
          return years;
        };

        setStats({
          totalCourses: coursesCount,
          totalStudents: 10, // Mock data
          averagePoints: 1866,
          totalBooksRead: books.length || 45,
          booksByLevel,
          quizStats,
          readingTime: {
            week: generateWeekData(),
            month: generateMonthData(),
            year: generateYearData(),
          },
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

  const readingTimeData =
    timeRange === "week"
      ? stats.readingTime.week
      : timeRange === "month"
      ? stats.readingTime.month
      : stats.readingTime.year;

  const readingTimeKey = timeRange === "week" ? "week" : timeRange === "month" ? "month" : "year";

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
              <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
              <p className="text-sm text-gray-600">Học viên</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {[
              { icon: FaBook, label: "Sách" },
              { icon: FaSchool, label: "Trường học" },
              { icon: FaUsers, label: "Lớp học" },
              { icon: FaGraduationCap, label: "Học viên" },
              { icon: FaClipboardList, label: "Bài tập" },
              { icon: FaBox, label: "Tài nguyên" },
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Class Card */}
            <div className="bg-green-50 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                  <FaUsers className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Khóa học</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalCourses}</p>
                </div>
              </div>
            </div>

            {/* Students Card */}
            <div className="bg-purple-50 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                  <FaGraduationCap className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Học viên</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
                </div>
              </div>
            </div>

            {/* Average Points Card */}
            <div className="bg-yellow-50 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                  <FaChartBar className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Điểm trung bình</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.averagePoints.toLocaleString()}
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
                  {stats.quizStats.totalQuizzes.toLocaleString()} Quiz
                </p>
                <p className="text-sm text-gray-600">
                  {stats.quizStats.correctAnswers.toLocaleString()} /{" "}
                  {stats.quizStats.totalAnswers.toLocaleString()} câu trả lời đúng
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
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 relative">
                    <svg className="transform -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="4"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke={COLORS.comprehension}
                        strokeWidth="4"
                        strokeDasharray={`${(stats.quizStats.comprehension / 100) * 175.9} 175.9`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold">{stats.quizStats.comprehension}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">Hiểu biết</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 relative">
                    <svg className="transform -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="4"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke={COLORS.grammar}
                        strokeWidth="4"
                        strokeDasharray={`${(stats.quizStats.grammar / 100) * 175.9} 175.9`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold">{stats.quizStats.grammar}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">Ngữ pháp</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 relative">
                    <svg className="transform -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="4"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke={COLORS.vocabulary}
                        strokeWidth="4"
                        strokeDasharray={`${(stats.quizStats.vocabulary / 100) * 175.9} 175.9`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold">{stats.quizStats.vocabulary}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">Từ vựng</p>
                </div>
              </div>
            </div>

            {/* Average Reading Time */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Thời gian đọc trung bình (phút)</h3>
                <div className="flex gap-2">
                  {(["week", "month", "year"] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1 text-sm rounded ${
                        timeRange === range
                          ? "bg-gray-800 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {range === "week" ? "Tuần" : range === "month" ? "Tháng" : "Năm"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={readingTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey={readingTimeKey}
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="myAverage"
                      fill="#3B82F6"
                      name="Trung bình của tôi"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={readingTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={readingTimeKey} tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="schoolAverage"
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Trung bình trường"
                      dot={{ fill: "#10B981", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

