import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Outlet, Navigate } from 'react-router-dom'; 

import MuiSidebar from './MuiSidebar'; // Sidebar MUI
import AdminHeader from './AdminHeader';   // Header MUI mới
import { useAuth } from '../../hooks/useAuth'; 

const AdminLayout: React.FC = () => {
  const theme = useTheme();
  const { user, isLoading } = useAuth();
  
  // Trạng thái quản lý việc mở/đóng Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 

  const handleDrawerToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Bảo vệ Route: Chỉ cho phép Admin truy cập
  if (isLoading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Typography>Đang tải phiên Admin...</Typography>
        </Box>
    );
  }
  
  if (!user || user.role !== 'admin') {
      return <Navigate to="/login" replace />;
  }


  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Header (Navbar trên cùng) */}
      <AdminHeader 
          onToggleDrawer={handleDrawerToggle} 
          isSidebarOpen={isSidebarOpen} 
      />
      
      {/* Sidebar bên trái */}
      <MuiSidebar 
        open={isSidebarOpen} 
        onToggle={handleDrawerToggle} 
      />
      
      {/* Main Content Area */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          // Padding top để nội dung không bị Header che khuất
          pt: 8, 
          bgcolor: theme.palette.grey[100], // Background cho toàn bộ khu vực nội dung
          width: { sm: `calc(100% - ${isSidebarOpen ? 240 : 72}px)` } 
        }}
      >
        <Outlet /> {/* Nội dung trang (như OverviewPage) render ở đây */}
      </Box>
    </Box>
  );
};

export default AdminLayout;