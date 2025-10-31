// src/pages/dashboard/Shared/ViewTeacher.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { FaUsers, FaBookOpen, FaChalkboardTeacher } from "react-icons/fa";

import { useAuth } from "../../../hooks/useAuth";
import userApi from "../../../api/userApi";
import courseTeacherApi from "../../../api/courseTeacherApi";

const StatCardContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  boxShadow: theme.shadows[3],
  height: "100%",
  borderRadius: 16,
}));

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => (
  <Grid item xs={12} sm={6} md={4}>
    <StatCardContainer>
      <Box
        sx={{
          mr: 2,
          p: 1.25,
          borderRadius: "50%",
          backgroundColor: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
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
      </Box>
    </StatCardContainer>
  </Grid>
);

const ViewTeacher: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    customers: 0,
    teachers: 0,
    activeCourses: 0,
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [usersRes, coursesRes] = await Promise.all([
          userApi.getAll(),
          courseTeacherApi.getAll({ status: "active" }),
        ]);

        const users = Array.isArray(usersRes.data)
          ? usersRes.data
          : usersRes.data?.data ?? [];
        const courses = Array.isArray(coursesRes.data)
          ? coursesRes.data
          : coursesRes.data?.data ?? [];

        const customers = users.filter((u) => u.role === "customer").length;
        const teachers = users.filter((u) => u.role === "teacher").length;
        const activeCourses = courses.length;

        setStats({ customers, teachers, activeCourses });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        Chào mừng trở lại, {user?.name || "Teacher"}!
      </Typography>

      <Grid container spacing={3}>
        <StatCard
          icon={<FaUsers size={22} />}
          title="Tổng số học viên"
          value={stats.customers}
          color="rgba(59, 130, 246, 1)"
        />
        <StatCard
          icon={<FaBookOpen size={22} />}
          title="Khóa học đang hoạt động"
          value={stats.activeCourses}
          color="rgba(16, 185, 129, 1)"
        />
        <StatCard
          icon={<FaChalkboardTeacher size={22} />}
          title="Giáo viên"
          value={stats.teachers}
          color="rgba(168, 85, 247, 1)"
        />
      </Grid>
    </Box>
  );
};

export default ViewTeacher;
