import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { FaUsers, FaBookOpen, FaChalkboardTeacher } from 'react-icons/fa';
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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StarIcon from '@mui/icons-material/Star';

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
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
          {value}
        </Typography>
        {caption && (
          <Typography variant="caption" color="text.secondary">
            {caption}
          </Typography>
        )}
      </Box>
    </StatCardContainer>
  </Grid>
);

// Panel bao khung có tiêu đề + nội dung
const Panel: React.FC<{ title: string; right?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  right,
  children,
}) => (
  <Paper elevation={3} sx={{ p: 2.5, borderRadius: 2 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
      <Typography variant="h6" fontWeight={600}>
        {title}
      </Typography>
      {right}
    </Box>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Paper>
);

const OverviewPage: React.FC = () => {
  const { user } = useAuth();

  // Mock demo data – sau này nối API thật
  const studentCount = '1,250';
  const activeCourses = '42';
  const teacherCount = '78';
  const ordersToday = '57';

  const progress = [
    { label: 'Doanh thu tháng', value: 72 },
    { label: 'Tiến độ phê duyệt khóa học', value: 55 },
    { label: 'Tỷ lệ hoàn thành quiz', value: 81 },
  ];

  const recent = [
    { primary: 'Nguyễn Văn A đã mua Course: React Fundamentals', secondary: '5 phút trước', icon: <ShoppingCartIcon /> },
    { primary: 'Phê duyệt khóa học: Data Structures (Teacher: T. Minh)', secondary: '18 phút trước', icon: <AssignmentTurnedInIcon /> },
    { primary: 'Đơn hàng #INV-2025-1024 hoàn tất', secondary: '1 giờ trước', icon: <TrendingUpIcon /> },
    { primary: 'Học viên Lê B review 5★ cho “Java OOP”', secondary: '2 giờ trước', icon: <StarIcon /> },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        Chào mừng trở lại, {user?.fullName || 'Admin'}!
      </Typography>

      {/* Stat cards */}
      <Grid container spacing={3}>
        <StatCard
          icon={<FaUsers size={22} />}
          title="Tổng số học sinh"
          value={studentCount}
          colorClass="rgba(59, 130, 246, 1)"
          caption="+3.2% so với tuần trước"
        />
        <StatCard
          icon={<FaBookOpen size={22} />}
          title="Khóa học đang hoạt động"
          value={activeCourses}
          colorClass="rgba(16, 185, 129, 1)"
          caption="4 khóa chờ duyệt"
        />
        <StatCard
          icon={<FaChalkboardTeacher size={22} />}
          title="Giáo viên"
          value={teacherCount}
          colorClass="rgba(168, 85, 247, 1)"
          caption="+2 mới tuần này"
        />
      </Grid>

      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        {/* Chỉ số nổi bật (progress) */}
        <Grid item xs={12} md={6}>
          <Panel title="Chỉ số nổi bật" right={<Chip size="small" color="primary" label="Realtime" icon={<TrendingUpIcon />} />}>
            <Box display="grid" gap={2}>
              {progress.map((p) => (
                <Box key={p.label}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      {p.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {p.value}%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={p.value} sx={{ height: 8, borderRadius: 999 }} />
                </Box>
              ))}
            </Box>
          </Panel>
        </Grid>

        {/* Hoạt động gần đây */}
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

        {/* Doanh thu (placeholder) */}
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
