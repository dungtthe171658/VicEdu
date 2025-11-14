// src/pages/dashboard/Shared/ViewTeacher.tsx
import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Paper, CircularProgress } from "@mui/material";
import { styled } from "@mui/material/styles";
import { FaUsers, FaBookOpen, FaMoneyBillWave } from "react-icons/fa";

import { useAuth } from "../../../hooks/useAuth";
import courseTeacherApi from "../../../api/courseTeacherApi";
import orderApi from "../../../api/orderApi";
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

        const TARGET = new Set(["pending"]);
        const uniqueStudents = new Set<string>();
        let revenue = 0;
        const currentTeacherId = toId((user as any)?._id || (user as any)?.id);

        for (const o of orders || []) {
          if (!o || !TARGET.has((o as any).status)) continue;

          // Tính income dựa trên order_items
          const orderItems: any[] = Array.isArray((o as any).order_items) ? (o as any).order_items : [];
          
          for (const item of orderItems) {
            if (!item) continue;
            
            const productType = String(item.product_type || '').toLowerCase();
            
            // Chỉ tính cho Course
            if (productType === 'course') {
              const product = item.product;
              if (!product) continue;
              
              // Kiểm tra xem course có thuộc về teacher này không
              const courseId = toId(product._id);
              if (!teacherCourseIds.has(courseId)) continue;
              
              // Kiểm tra teacher field trong product
              const productTeachers: any = product.teacher;
              let isTeacherOwner = false;
              
              if (Array.isArray(productTeachers)) {
                // Nếu teacher là array, kiểm tra xem có chứa currentTeacherId không
                isTeacherOwner = productTeachers.some((t: any) => toId(t) === currentTeacherId);
              } else if (productTeachers) {
                // Nếu teacher là single value
                isTeacherOwner = toId(productTeachers) === currentTeacherId;
              }
              
              // Nếu không có teacher field trong product, dùng teacherCourseIds để kiểm tra
              if (!isTeacherOwner && teacherCourseIds.has(courseId)) {
                isTeacherOwner = true;
              }
              
              if (isTeacherOwner) {
                const priceAtPurchase = Number(item.price_at_purchase || 0);
                const quantity = Number(item.quantity || 1);
                const itemTotal = priceAtPurchase * quantity;
                
                // Teacher nhận 50% từ Course
                revenue += 0.5 * itemTotal;
                
                // Đếm học viên
                const uid = typeof (o as any).user_id === "string" ? String((o as any).user_id) : toId((o as any).user_id);
                if (uid) uniqueStudents.add(uid);
              }
            }
          }
        }
        const studentsCount = uniqueStudents.size;
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
        <StatCard icon={<FaUsers size={22} />} title="Học viên" value={stats.students} color="rgba(59, 130, 246, 1)" />
        <StatCard icon={<FaMoneyBillWave size={22} />} title="Doanh thu" value={formatCurrency(stats.revenue)} color="rgba(16, 185, 129, 1)" />
        <StatCard icon={<FaBookOpen size={22} />} title="Khóa học" value={stats.activeCourses} color="rgba(168, 85, 247, 1)" />
      </Grid>
    </Box>
  );
};

export default ViewTeacher;
