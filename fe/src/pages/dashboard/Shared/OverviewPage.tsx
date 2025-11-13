import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  FaUsers, 
  FaBookOpen, 
  FaChalkboardTeacher, 
  FaShoppingCart,
  FaBook,
  FaFolder,
  FaStar,
  FaEdit,
  FaMoneyBillWave,
} from 'react-icons/fa';
import { 
  ShoppingCart as ShoppingCartIcon, 
  Edit as EditIcon,
} from '@mui/icons-material';

import { useAuth } from '../../../hooks/useAuth';
import userApi from '../../../api/userApi';
import orderApi from '../../../api/orderApi';
import bookApi from '../../../api/bookApi';
import categoryApi from '../../../api/categoryApi';
import historyApi from '../../../api/historyApi';
import courseApi from '../../../api/courseApi';
import reviewApi from '../../../api/reviewApi';

const StatCardContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  display: 'flex',
  alignItems: 'center',
  boxShadow: theme.shadows[4],
  height: '100%',
  borderRadius: 16,
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  colorClass: string;
  caption?: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, colorClass, caption, trend }) => (
  <Grid item xs={12} sm={6} md={3} lg={3}>
    <StatCardContainer>
      <Box
        sx={{
          mr: 2,
          p: 1.5,
          borderRadius: '50%',
          backgroundColor: colorClass,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          minWidth: 56,
          minHeight: 56,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="h5" fontWeight={700} lineHeight={1.2} sx={{ mb: 0.5 }}>
          {value}
        </Typography>
        {caption && (
          <Typography variant="caption" color="text.secondary">
            {caption}
          </Typography>
        )}
        {trend && (
          <Typography variant="caption" sx={{ color: 'success.main', display: 'block', mt: 0.5 }}>
            {trend}
          </Typography>
        )}
      </Box>
    </StatCardContainer>
  </Grid>
);

const Panel: React.FC<{ title: string; right?: React.ReactNode; children: React.ReactNode }> = ({ title, right, children }) => (
  <Paper elevation={3} sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
      <Typography variant="h6" fontWeight={600}>{title}</Typography>
      {right}
    </Box>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Paper>
);

const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) return 'Vừa xong';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};

const OverviewPage: React.FC = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    customers: 0,
    teachers: 0,
    activeCourses: 0,
    totalCourses: 0,
    totalBooks: 0,
    totalCategories: 0,
    totalReviews: 0,
    pendingEdits: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    failedOrders: 0,
  });
  const [recent, setRecent] = useState<{ primary: string; secondary: string; icon: React.ReactNode; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingIncome, setPendingIncome] = useState<number>(0);

  const formatCurrency = (n: number) =>
    Number(n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        // Fetch tất cả dữ liệu cần thiết
        const [
          usersRes,
          orders,
          booksRes,
          categoriesRes,
          pendingEditsRes,
          coursesCountRes,
          reviewsCountRes,
        ] = await Promise.all([
          userApi.getAll().catch(() => ({ data: [] })),
          orderApi.getAll().catch(() => [] as any[]),
          bookApi.getAll().catch(() => ({ data: [] })),
          categoryApi.getAll().catch(() => ({ data: [] })),
          historyApi.listAdminPendingAll().catch(() => ({ data: [], count: 0 })),
          courseApi.countAll().catch(() => ({ count: 0 })),
          reviewApi.countAll().catch(() => ({ count: 0 })),
        ]);

        // Xử lý users
        const users = Array.isArray((usersRes as any).data) ? (usersRes as any).data : ((usersRes as any).data?.data ?? []);
        const customers = users.filter((u: any) => u.role === 'customer').length;
        const teachers = users.filter((u: any) => u.role === 'teacher').length;

        // Xử lý courses - axios interceptor trả về response.data trực tiếp, nên response là { count: X }
        const totalCoursesCount = Number((coursesCountRes as any)?.count ?? 0);

        // Xử lý books
        const books = Array.isArray(booksRes.data) ? booksRes.data : booksRes.data?.data ?? [];
        const totalBooks = books.length;

        // Xử lý categories
        const categories = Array.isArray(categoriesRes.data) 
          ? categoriesRes.data 
          : categoriesRes.data?.data ?? [];
        const totalCategories = categories.length;

        // Xử lý reviews - axios interceptor trả về response.data trực tiếp, nên response là { count: X }
        const totalReviewsCount = Number((reviewsCountRes as any)?.count ?? 0);

        // Xử lý pending edits
        const pendingEdits = pendingEditsRes.count || (Array.isArray(pendingEditsRes.data) ? pendingEditsRes.data.length : 0);

        // Xử lý orders
        const ordersList: any[] = Array.isArray(orders) ? orders : [];
        const totalOrders = ordersList.length;
        const pendingOrders = ordersList.filter((o: any) => o.status === 'pending').length;
        const completedOrders = ordersList.filter((o: any) => o.status === 'completed').length;
        const failedOrders = ordersList.filter((o: any) => o.status === 'failed' || o.status === 'cancelled').length;

        // Tính income từ orders có status = "pending"
        let adminPendingIncome = 0;

        for (const o of ordersList) {
          if (!o || String((o as any).status || '').toLowerCase() !== 'pending') continue;
          
          const orderItems: any[] = Array.isArray((o as any).order_items) ? (o as any).order_items : [];

          for (const item of orderItems) {
            if (!item) continue;

            const productType = String(item.product_type || '').toLowerCase();
            const priceAtPurchase = Number(item.price_at_purchase || 0);
            const quantity = Number(item.quantity || 1);
            const itemTotal = priceAtPurchase * quantity;

            if (productType === 'book') {
              // Admin nhận 100% từ Book
              adminPendingIncome += itemTotal;
            } else if (productType === 'course') {
              // Admin nhận 50% từ Course
              adminPendingIncome += 0.5 * itemTotal;
            }
          }
        }

        setPendingIncome(adminPendingIncome);

        // Cập nhật stats
        setStats({
          customers,
          teachers,
          activeCourses: totalCoursesCount, // Tổng số khóa học
          totalCourses: totalCoursesCount, // Tổng số khóa học
          totalBooks,
          totalCategories,
          totalReviews: totalReviewsCount, // Tổng số đánh giá
          pendingEdits,
          totalOrders,
          pendingOrders,
          completedOrders,
          failedOrders,
        });


        // Recent activities từ dữ liệu thật
        const recentActivities: { primary: string; secondary: string; icon: React.ReactNode; type: string }[] = [];

        // Recent orders
        const recentOrders = ordersList
          .sort((a: any, b: any) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 3);

        recentOrders.forEach((order: any) => {
          const userName = typeof order.user_id === 'object' && order.user_id?.name 
            ? order.user_id.name 
            : 'Khách hàng';
          const orderId = order._id?.slice(-6) || 'N/A';
          recentActivities.push({
            primary: `${userName} đã tạo đơn hàng #${orderId}`,
            secondary: formatTimeAgo(order.created_at),
            icon: <ShoppingCartIcon />,
            type: 'order',
          });
        });

        // Bỏ phần recent courses và reviews vì chỉ đếm theo ID

        // Recent pending edits
        const recentPendingEdits = Array.isArray(pendingEditsRes.data) 
          ? pendingEditsRes.data.slice(0, 2) 
          : [];
        
        recentPendingEdits.forEach((edit: any) => {
          recentActivities.push({
            primary: `Chỉnh sửa ${edit.target_type} đang chờ duyệt`,
            secondary: formatTimeAgo(edit.created_at),
            icon: <EditIcon />,
            type: 'edit',
          });
        });


        setRecent(recentActivities.slice(0, 6));

      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        Chào mừng trở lại, {(user as any)?.fullName || (user as any)?.name || 'Admin'}! 👋
      </Typography>

      {/* Stat Cards Row 1 - Main Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <StatCard 
          icon={<FaUsers size={24} />} 
          title="Tổng số học sinh" 
          value={stats.customers ?? 0} 
          colorClass="rgba(59, 130, 246, 1)" 
        />
        <StatCard 
          icon={<FaBookOpen size={24} />} 
          title="Tổng số khóa học" 
          value={stats.totalCourses ?? 0} 
          colorClass="rgba(16, 185, 129, 1)" 
         
        />
        <StatCard 
          icon={<FaChalkboardTeacher size={24} />} 
          title="Giáo viên" 
          value={stats.teachers ?? 0} 
          colorClass="rgba(168, 85, 247, 1)" 
        />
        <StatCard 
          icon={<FaBook size={24} />} 
          title="Tổng số sách" 
          value={stats.totalBooks ?? 0} 
          colorClass="rgba(239, 68, 68, 1)" 
        />
      </Grid>

      {/* Stat Cards Row 2 - Management Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <StatCard 
          icon={<FaShoppingCart size={24} />} 
          title="Tổng đơn hàng" 
          value={stats.totalOrders ?? 0} 
          colorClass="rgba(245, 158, 11, 1)" 
 
        />
        <StatCard 
          icon={<FaFolder size={24} />} 
          title="Danh mục" 
          value={stats.totalCategories ?? 0} 
          colorClass="rgba(14, 165, 233, 1)" 
        />
        <StatCard 
          icon={<FaStar size={24} />} 
          title="Đánh giá" 
          value={stats.totalReviews ?? 0} 
          colorClass="rgba(251, 191, 36, 1)" 
        />
        <StatCard 
          icon={<FaEdit size={24} />} 
          title="Chỉnh sửa chờ duyệt" 
          value={stats.pendingEdits ?? 0} 
          colorClass="rgba(236, 72, 153, 1)" 
        />
      </Grid>

      {/* Income Card */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Box
                  sx={{
                    mr: 2,
                    p: 1.5,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(251, 191, 36, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(245, 158, 11, 1)',
                  }}
                >
                  <FaMoneyBillWave size={24} />
                  </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Thu nhập
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="rgba(245, 158, 11, 1)">
                    {formatCurrency(pendingIncome)}
                  </Typography>
                </Box>
            </Box>
           
            </CardContent>
          </Card>
        </Grid>
        </Grid>

      {/* Recent Activities */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Panel title="Hoạt động gần đây">
            {recent.length > 0 ? (
            <List dense>
              {recent.map((r, idx) => (
                  <ListItem key={idx} disableGutters sx={{ py: 1, borderBottom: idx < recent.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                    <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                      {r.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={r.primary} 
                      secondary={r.secondary}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                </ListItem>
              ))}
            </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Chưa có hoạt động gần đây
            </Typography>
            )}
          </Panel>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OverviewPage;
