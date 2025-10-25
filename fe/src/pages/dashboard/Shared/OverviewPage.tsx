import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { FaUsers, FaBookOpen, FaChalkboardTeacher } from 'react-icons/fa';
import { TrendingUp as TrendingUpIcon, ShoppingCart as ShoppingCartIcon, AssignmentTurnedIn as AssignmentTurnedInIcon, Star as StarIcon } from '@mui/icons-material';

import { useAuth } from '../../../hooks/useAuth';
import userApi from '../../../api/userApi';
import courseAdminApi from '../../../api/courseAdminApi';

const StatCardContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  boxShadow: theme.shadows[3],
  height: '100%',
  borderRadius: 16,
}));

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  colorClass: string;
  caption?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, colorClass, caption }) => (
  <Grid item xs={12} sm={6} md={4}>
    <StatCardContainer>
      <Box
        sx={{
          mr: 2,
          p: 1.25,
          borderRadius: '50%',
          backgroundColor: colorClass,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h5" fontWeight={700} lineHeight={1.2}>{value}</Typography>
        {caption && <Typography variant="caption" color="text.secondary">{caption}</Typography>}
      </Box>
    </StatCardContainer>
  </Grid>
);

const Panel: React.FC<{ title: string; right?: React.ReactNode; children: React.ReactNode }> = ({ title, right, children }) => (
  <Paper elevation={3} sx={{ p: 2.5, borderRadius: 2 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
      <Typography variant="h6" fontWeight={600}>{title}</Typography>
      {right}
    </Box>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Paper>
);

const OverviewPage: React.FC = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({ customers: 0, teachers: 0, activeCourses: 0 });
  const [progress, setProgress] = useState<{ label: string; value: number }[]>([]);
  const [recent, setRecent] = useState<{ primary: string; secondary: string; icon: React.ReactNode }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [usersRes, coursesRes] = await Promise.all([
          userApi.getAll(),
          courseAdminApi.getAll({ status: 'active' }),
        ]);

        // Kiểm tra cấu trúc dữ liệu
        const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data ?? [];
        const courses = Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data?.data ?? [];

        const customers = users.filter(u => u.role === 'customer').length;
        const teachers = users.filter(u => u.role === 'teacher').length;
        const activeCourses = courses.length;

        setStats({ customers, teachers, activeCourses });

        // Ví dụ dữ liệu progress (sau này thay bằng API thực)
        setProgress([
          { label: 'Doanh thu tháng', value: 72 },
          { label: 'Tiến độ phê duyệt khóa học', value: 55 },
          { label: 'Tỷ lệ hoàn thành quiz', value: 81 },
        ]);

        // Ví dụ recent activities (sau này thay bằng API thực)
        const recentActivities = [
          { primary: 'Nguyễn Văn A đã mua Course: React Fundamentals', secondary: '5 phút trước', type: 'order' },
          { primary: 'Phê duyệt khóa học: Data Structures (Teacher: T. Minh)', secondary: '18 phút trước', type: 'approval' },
          { primary: 'Đơn hàng #INV-2025-1024 hoàn tất', secondary: '1 giờ trước', type: 'growth' },
          { primary: 'Học viên Lê B review 5★ cho “Java OOP”', secondary: '2 giờ trước', type: 'review' },
        ];

        const mappedRecent = recentActivities.map(item => {
          let icon: React.ReactNode;
          switch (item.type) {
            case 'order': icon = <ShoppingCartIcon />; break;
            case 'approval': icon = <AssignmentTurnedInIcon />; break;
            case 'growth': icon = <TrendingUpIcon />; break;
            case 'review': icon = <StarIcon />; break;
            default: icon = <TrendingUpIcon />;
          }
          return { ...item, icon };
        });

        setRecent(mappedRecent);

      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        Chào mừng trở lại, {user?.fullName || 'Admin'}!
      </Typography>

      <Grid container spacing={3}>
        <StatCard icon={<FaUsers size={22} />} title="Tổng số học sinh" value={stats.customers ?? 0} colorClass="rgba(59, 130, 246, 1)"  />
        <StatCard icon={<FaBookOpen size={22} />} title="Khóa học đang hoạt động" value={stats.activeCourses ?? 0} colorClass="rgba(16, 185, 129, 1)" />
        <StatCard icon={<FaChalkboardTeacher size={22} />} title="Giáo viên" value={stats.teachers ?? 0} colorClass="rgba(168, 85, 247, 1}" />
      </Grid>

      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}>
          <Panel title="Chỉ số nổi bật" right={<Chip size="small" color="primary" label="Realtime" icon={<TrendingUpIcon />} />}>
            <Box display="grid" gap={2}>
              {progress.map(p => (
                <Box key={p.label}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">{p.label}</Typography>
                    <Typography variant="body2" fontWeight={600}>{p.value}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={p.value} sx={{ height: 8, borderRadius: 999 }} />
                </Box>
              ))}
            </Box>
          </Panel>
        </Grid>

        <Grid item xs={12} md={6}>
          <Panel title="Hoạt động gần đây">
            <List dense>
              {recent.map((r, idx) => (
                <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36, color: 'warning.main' }}>{r.icon}</ListItemIcon>
                  <ListItemText primary={r.primary} secondary={r.secondary} />
                </ListItem>
              ))}
            </List>
          </Panel>
        </Grid>

        <Grid item xs={12}>
          <Panel title="Bảng điều khiển doanh thu (UC04)">
            <Typography variant="body2" color="text.secondary">
              Khu vực này sẽ hiển thị biểu đồ doanh thu, phân bổ danh mục và tăng trưởng theo thời gian sau khi nối API.
            </Typography>
          </Panel>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OverviewPage;
