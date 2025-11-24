import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Visibility as VisibilityIcon,
  Speed as SpeedIcon,
  Diamond as DiamondIcon,
  AccessTime as AccessTimeIcon,
  MenuBook as MenuBookIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import userApi from '../../../api/userApi';
import enrollmentApi from '../../../api/enrollmentApi';
import quizApi from '../../../api/quizApi';
import bookApi from '../../../api/bookApi';
import { buildAvatarUrl } from '../../../utils/buildAvatarUrl';
import type { UserDto } from '../../../types/user.d';

interface StudentProgress {
  student: UserDto;
  totalCourses: number;
  totalQuizAttempts: number;
  averageProgress: number;
  totalPoints?: number;
  totalBooks?: number;
  totalMinutes?: number;
}

const ManageTracksProcessPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    fetchStudentProgress();
  }, []);

  useEffect(() => {
    let filtered = [...students];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.student.name || '').localeCompare(b.student.name || '');
        case 'courses':
          return b.totalCourses - a.totalCourses;
        case 'progress':
          return b.averageProgress - a.averageProgress;
        case 'quizzes':
          return b.totalQuizAttempts - a.totalQuizAttempts;
        default:
          return 0;
      }
    });

    setFilteredStudents(filtered);
  }, [searchTerm, sortBy, students]);

  const fetchStudentProgress = async () => {
    try {
      setLoading(true);
      // Get all users (students)
      const usersRes = await userApi.getAll();
      const users: UserDto[] = Array.isArray(usersRes?.data)
        ? usersRes.data
        : Array.isArray(usersRes)
        ? usersRes
        : usersRes?.data?.data || usersRes?.data || [];

      // Filter only students (role !== 'admin' && role !== 'teacher')
      const studentUsers = users.filter(
        (u) => u.role !== 'admin' && u.role !== 'teacher'
      );

      // Get all enrollments
      const enrollmentsRes = await enrollmentApi.getAllForAdmin();
      const enrollments = Array.isArray(enrollmentsRes?.data)
        ? enrollmentsRes.data
        : Array.isArray(enrollmentsRes)
        ? enrollmentsRes
        : [];

      // Group enrollments by user and calculate stats
      const studentMap = new Map<string, {
        student: UserDto;
        courses: Set<string>;
        progressSum: number;
        progressCount: number;
      }>();

      // Initialize map with all students
      studentUsers.forEach((student) => {
        studentMap.set(student._id || '', {
          student,
          courses: new Set(),
          progressSum: 0,
          progressCount: 0,
        });
      });

      // Process enrollments
      enrollments.forEach((enrollment: any) => {
        const userId = enrollment.user_id?._id || enrollment.user_id;
        if (!userId) return;

        const studentId = String(userId);
        const studentData = studentMap.get(studentId);
        if (!studentData) return;

        const courseId = enrollment.course_id?._id || enrollment.course_id;
        if (courseId) {
          studentData.courses.add(String(courseId));
        }

        if (enrollment.progress !== undefined) {
          studentData.progressSum += enrollment.progress || 0;
          studentData.progressCount++;
        }
      });

      // Get quiz attempts for all students
      const quizAttemptsMap = new Map<string, number>();
      await Promise.all(
        studentUsers.map(async (student) => {
          try {
            const attemptsRes = await quizApi.getAttemptsByUserForAdmin(student._id || '');
            // Handle different response structures from axios
            const attempts = Array.isArray(attemptsRes?.data)
              ? attemptsRes.data
              : Array.isArray(attemptsRes)
              ? attemptsRes
              : [];
            // Chỉ đếm các quiz attempts đã hoàn thành
            const completedAttempts = attempts.filter((attempt: any) => attempt.completed === true);
            quizAttemptsMap.set(student._id || '', completedAttempts.length);
          } catch (error) {
            console.error(`Error fetching quiz attempts for student ${student._id}:`, error);
            quizAttemptsMap.set(student._id || '', 0);
          }
        })
      );

      // Get purchased books count for all students
      const booksCountMap = new Map<string, number>();
      await Promise.all(
        studentUsers.map(async (student) => {
          try {
            const booksRes = await bookApi.getPurchasedBookCountByUserId(student._id || '');
            const count = booksRes?.data?.count || booksRes?.count || 0;
            booksCountMap.set(student._id || '', count);
          } catch (error) {
            console.error(`Error fetching books count for student ${student._id}:`, error);
            booksCountMap.set(student._id || '', 0);
          }
        })
      );

      // Convert map to array
      const progressData: StudentProgress[] = Array.from(studentMap.values()).map((item) => {
        const averageProgress = item.progressCount > 0
          ? item.progressSum / item.progressCount
          : 0;

        return {
          student: item.student,
          totalCourses: item.courses.size,
          totalQuizAttempts: quizAttemptsMap.get(item.student._id || '') || 0,
          averageProgress,
          totalPoints: Math.floor(Math.random() * 5000) + 500, // Mock data - replace with real data
          totalBooks: booksCountMap.get(item.student._id || '') || 0,
          totalMinutes: Math.floor(Math.random() * 2000) + 200, // Mock data
        };
      });

      setStudents(progressData);
      setFilteredStudents(progressData);
    } catch (error) {
      console.error('Error fetching student progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (studentId: string) => {
    navigate(`/dashboard/manage-tracksprocess/${studentId}`);
  };

  const getLevelBadge = (progress: number) => {
    if (progress >= 80) return { label: 'Level 6', color: '#ef4444' }; // Red
    if (progress >= 60) return { label: 'Level 3', color: '#f59e0b' }; // Yellow/Orange
    if (progress >= 40) return { label: 'Level 2', color: '#8b5cf6' }; // Purple
    if (progress >= 20) return { label: 'Level 1', color: '#10b981' }; // Green
    return { label: 'Starter', color: '#ff6b9d' }; // Pink
  };

  // Calculate school stats
  const schoolStats = {
    averageScore: students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + (s.totalPoints || 0), 0) / students.length)
      : 0,
    averageLevel: students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.averageProgress, 0) / students.length)
      : 0,
    averageReadingTime: students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + (s.totalMinutes || 0), 0) / students.length)
      : 0,
    averageBooksRead: students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + (s.totalBooks || 0), 0) / students.length)
      : 0,
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Quản lý tiến độ học tập
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content - Student Cards */}
        <Grid item xs={12} md={8}>
          {/* Search and Sort */}
          <Box display="flex" gap={2} mb={3}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm theo tên hoặc email học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Sắp xếp</InputLabel>
              <Select
                value={sortBy}
                label="Sắp xếp"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="name">Tên (A-Z)</MenuItem>
                <MenuItem value="courses">Số khóa học</MenuItem>
                <MenuItem value="progress">Tiến độ</MenuItem>
                <MenuItem value="quizzes">Số Quiz</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Student Cards Grid */}
          {filteredStudents.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Không có dữ liệu học sinh
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {filteredStudents.map((item) => {
                const badge = getLevelBadge(item.averageProgress);
                const avatarUrl = buildAvatarUrl(item.student.avatar);
                const initials = item.student.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || 'U';

                return (
                  <Grid item xs={12} sm={6} md={6} key={item.student._id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                        {/* Header with Avatar and Name */}
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          {avatarUrl ? (
                            <Avatar
                              src={avatarUrl}
                              alt={item.student.name}
                              sx={{ width: 60, height: 60 }}
                            />
                          ) : (
                            <Avatar
                              sx={{
                                width: 60,
                                height: 60,
                                bgcolor: badge.color,
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                              }}
                            >
                              {initials}
                            </Avatar>
                          )}
                          <Box flex={1}>
                            <Typography variant="h6" fontWeight="bold" noWrap>
                              {item.student.name || 'N/A'}
                            </Typography>
                            <Chip
                              label={badge.label}
                              size="small"
                              sx={{
                                bgcolor: badge.color,
                                color: 'white',
                                fontWeight: 'bold',
                                mt: 0.5,
                                height: 22,
                              }}
                            />
                          </Box>
                        </Box>

                        {/* Stats Chips */}
                        <Box display="flex" gap={1} mb={2}>
                          <Chip
                            label={`${item.totalCourses} Khóa học`}
                            size="small"
                            sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem' }}
                          />
                          <Chip
                            label={`${item.totalQuizAttempts} Quiz`}
                            size="small"
                            sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem' }}
                          />
                        </Box>

                        {/* Metrics */}
                        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={1.5} mb={2}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Điểm số
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {item.totalPoints?.toLocaleString() || 0} điểm
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Sách đã mua
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {item.totalBooks || 0} sách
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Thời gian
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {item.totalMinutes || 0} phút
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Tỷ lệ
                            </Typography>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <TrophyIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                              <Typography variant="body2" fontWeight="bold">
                                {item.averageProgress.toFixed(0)}%
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* View Detail Button */}
                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewDetail(item.student._id || '')}
                          sx={{ mt: 1 }}
                        >
                          Xem chi tiết
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Grid>

        {/* Sidebar - School Stats */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Thống kê tổng quan
            </Typography>

            <Box display="flex" flexDirection="column" gap={2.5}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: '#e0f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SpeedIcon sx={{ color: '#0369a1', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Điểm trung bình
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {schoolStats.averageScore.toLocaleString()} điểm
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <DiamondIcon sx={{ color: '#d97706', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Cấp độ trung bình
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    Level {Math.floor(schoolStats.averageLevel / 20) + 1}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AccessTimeIcon sx={{ color: '#1e40af', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Thời gian đọc TB
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {schoolStats.averageReadingTime.toLocaleString()} phút
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: '#f3e8ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MenuBookIcon sx={{ color: '#7c3aed', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Sách đã mua TB
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {schoolStats.averageBooksRead} sách
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ManageTracksProcessPage;
