import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  CircularProgress,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import userApi from '../../../api/userApi';
import enrollmentApi from '../../../api/enrollmentApi';
import quizApi from '../../../api/quizApi';
import type { UserDto } from '../../../types/user.d';

interface StudentProgress {
  student: UserDto;
  totalCourses: number;
  totalQuizAttempts: number;
  averageProgress: number;
}

const ManageTracksProcessPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudentProgress();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(
        (s) =>
          s.student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

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
            const attempts = Array.isArray(attemptsRes?.data)
              ? attemptsRes.data
              : Array.isArray(attemptsRes)
              ? attemptsRes
              : [];
            quizAttemptsMap.set(student._id || '', attempts.length);
          } catch (error) {
            console.error(`Error fetching quiz attempts for student ${student._id}:`, error);
            quizAttemptsMap.set(student._id || '', 0);
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

      <Paper sx={{ p: 2, mb: 3 }}>
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
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Học sinh</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell align="center"><strong>Số khóa học</strong></TableCell>
              <TableCell align="center"><strong>Số lần Quiz</strong></TableCell>
              <TableCell align="center"><strong>Tiến độ TB (%)</strong></TableCell>
              <TableCell align="center"><strong>Thao tác</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" py={3}>
                    Không có dữ liệu học sinh
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((item) => (
                <TableRow key={item.student._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {item.student.name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {item.student.email || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={item.totalCourses} color="primary" size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={item.totalQuizAttempts} color="secondary" size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${item.averageProgress.toFixed(1)}%`}
                      color={item.averageProgress >= 70 ? 'success' : item.averageProgress >= 50 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewDetail(item.student._id || '')}
                    >
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ManageTracksProcessPage;

