import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import MuiSidebar from '../Layout/MuiSidebar';
import AdminNavbar from '../Layout/AdminNavbar';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED = 72;

const AdminLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [open, setOpen] = useState(true);

  if (isLoading) return <Box p={3}>Đang tải…</Box>;
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.100' }}>
      {/* Navbar trên cùng (co giãn theo sidebar) */}
      <AdminNavbar
        onToggleDrawer={() => setOpen((s) => !s)}
        isSidebarOpen={open}
        sidebarWidth={SIDEBAR_WIDTH}
        collapsedWidth={SIDEBAR_COLLAPSED}
        // title có thể bỏ trống để tự lấy từ URL
        showSearch
      />

      {/* Sidebar bên trái */}
      <MuiSidebar open={open} onToggle={() => setOpen((s) => !s)} />

      {/* Nội dung trang con */}
      <Box component="main" sx={{ flexGrow: 1, pt: 8, px: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
