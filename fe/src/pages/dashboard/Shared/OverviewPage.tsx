import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { FaUsers, FaBookOpen, FaChalkboardTeacher } from 'react-icons/fa';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';


const StatCardContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  boxShadow: theme.shadows[3],
  height: '100%',
}));

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  colorClass: string; 
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, colorClass }) => (
  <Grid item xs={12} sm={6} md={4}>
    <StatCardContainer>
      <Box
        sx={{
          mr: 2,
          p: 1,
          borderRadius: '50%',
          backgroundColor: colorClass,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ color: 'white' }}>
            {icon}
        </Box>
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h5" fontWeight={600}>{value}</Typography>
      </Box>
    </StatCardContainer>
  </Grid>
);


const OverviewPage: React.FC = () =>{
  const { user } = useAuth();


  const studentCount = "1,250";
  const activeCourses = "42";
  const teacherCount = "78";
  


  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
        Chào mừng trở lại, {user?.fullName || 'Admin'}!
      </Typography>

      <Grid container spacing={3}>
        <StatCard 
          icon={<FaUsers size={24} />}
          title="Tổng số học sinh"
          value={studentCount}
          colorClass="rgba(59, 130, 246, 1)"
        />
        <StatCard 
          icon={<FaBookOpen size={24} />}
          title="Khóa học đang hoạt động"
          value={activeCourses}
          colorClass="rgba(16, 185, 129, 1)"
        />
        <StatCard 
          icon={<FaChalkboardTeacher size={24} />}
          title="Giáo viên"
          value={teacherCount}
          colorClass="rgba(168, 85, 247, 1)"
        />
      </Grid>


      <Box mt={4}>
        <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Báo cáo doanh thu (UC04 - Cần API)</Typography>
            <Typography color="text.secondary">Nội dung biểu đồ và phân tích sẽ được thêm vào đây.</Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default OverviewPage;