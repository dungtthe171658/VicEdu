// src/pages/dashboard/Shared/ViewTeacher.tsx
import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Paper, CircularProgress } from "@mui/material";
import { styled } from "@mui/material/styles";
import { FaUsers, FaBookOpen, FaMoneyBillWave } from "react-icons/fa";

import { useAuth } from "../../../hooks/useAuth";
import courseTeacherApi from "../../../api/courseTeacherApi";
import orderApi from "../../../api/orderApi";
import dashboardApi from "../../../api/dashboardApi";
import type { Course } from "../../../types/course";
import type { OrderDto } from "../../../types/order";

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

function toId(val: any): string {
  if (val == null) return "";
  if (typeof val === "object") {
    if ((val as any).$oid) return String((val as any).$oid);
    if ((val as any)._id) return String((val as any)._id);
  if ((val as any).id) return String((val as any).id);
  }
  return String(val);
}

const formatCurrency = (n: number) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const formatVND = (n: number) => (Number(n || 0)).toLocaleString("vi-VN") + " ₫";

const ViewTeacher: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, revenue: 0, activeCourses: 0 });

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        // 1) Courses thuộc giáo viên (role teacher)
        const coursesRes = await courseTeacherApi.getAll();
        const courses: Course[] = Array.isArray((coursesRes as any)?.data)
          ? (coursesRes as any).data
          : (Array.isArray(coursesRes) ? (coursesRes as any) : (coursesRes as any)?.data) || [];

        const teacherCourseIds = new Set<string>((courses || []).map((c: any) => toId((c as any)._id)).filter(Boolean));
        const activeCourses = (courses || []).filter((c: any) => Boolean((c as any).is_published) || (c as any).status === "approved").length;

        // 2) Orders (BE nên trả về theo quyền; FE lọc theo courses của GV)
        let orders: OrderDto[] = [];
        try {
          orders = (await orderApi.getAll()) as unknown as OrderDto[];
        } catch {
          orders = [];
        }

        const COMPLETED = new Set(["completed", "paid"]);
        const uniqueStudents = new Set<string>();
        let revenue = 0;

        for (const o of orders || []) {
          if (!o || !COMPLETED.has((o as any).status)) continue;

          // Normalize courses inside order
          const rawCourses: any[] = Array.isArray((o as any).course)
            ? ((o as any).course as any[])
            : (Array.isArray((o as any).courses) ? ((o as any).courses as any[]) : []);
          const rawCourseIdsFromField = Array.isArray((o as any).course_id)
            ? ((o as any).course_id as any[]).map(toId)
            : ((o as any).course_id ? [toId((o as any).course_id)] : []);
          const orderedIds: string[] = rawCourses.length ? rawCourses.map((c: any) => toId((c as any)._id)).filter(Boolean) : rawCourseIdsFromField;

          const matchedIds = orderedIds.filter((id) => teacherCourseIds.has(id));
          if (matchedIds.length === 0) continue;

          const uid = typeof (o as any).user_id === "string" ? String((o as any).user_id) : toId((o as any).user_id);
          if (uid) uniqueStudents.add(uid);

          if (rawCourses.length) {
            for (const c of rawCourses) {
              const id = toId((c as any)._id);
              if (id && teacherCourseIds.has(id)) revenue += Number((c as any).price_cents || 0);
            }
          } else {
            const hasBooks = Array.isArray((o as any).book) ? ((o as any).book as any[]).length > 0 : Boolean((o as any).book_id);
            const allOwned = orderedIds.length > 0 && orderedIds.every((id) => teacherCourseIds.has(id));
            if (!hasBooks && allOwned) revenue += Number((o as any).total_amount || 0);
          }
        }

        // Prefer server-side aggregated stats when available
        let studentsCount = uniqueStudents.size;
        try {
          const serverStats = await dashboardApi.getTeacherStats();
          const apiStats = (serverStats as any)?.data ?? serverStats;
          if (apiStats && (apiStats as any).revenue != null) {
            revenue = Number((apiStats as any).revenue);
          }
          if (apiStats && (apiStats as any).students != null) {
            studentsCount = Number((apiStats as any).students);
          }
        } catch {}

        setStats({ students: studentsCount, revenue, activeCourses });
      } catch (err) {
        console.error("Failed to fetch teacher dashboard:", err);
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
        Chào mừng trở lại, {user?.name || "Giáo viên"}!
      </Typography>

      <Grid container spacing={3}>
        <StatCard icon={<FaUsers size={22} />} title="Học viên theo học" value={stats.students} color="rgba(59, 130, 246, 1)" />
        <StatCard icon={<FaMoneyBillWave size={22} />} title="Doanh thu (ước tính)" value={formatCurrency(stats.revenue)} color="rgba(16, 185, 129, 1)" />
        <StatCard icon={<FaBookOpen size={22} />} title="Khóa học đang hoạt động" value={stats.activeCourses} color="rgba(168, 85, 247, 1)" />
      </Grid>
    </Box>
  );
};

export default ViewTeacher;
