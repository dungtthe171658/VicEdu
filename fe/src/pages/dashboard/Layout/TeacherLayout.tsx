import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import TeacherSidebar from '../Layout/TeacherSidebar';
import TeacherNavbar from '../Layout/TeacherNavbar';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED = 72;

const TeacherLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [open, setOpen] = useState(true);

  if (isLoading) return <Box p={3}>Đang tải…</Box>;
  if (!user || user.role !== 'teacher') return <Navigate to="/login" replace />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <TeacherNavbar
        onToggleDrawer={() => setOpen((s) => !s)}
        isSidebarOpen={open}
        sidebarWidth={SIDEBAR_WIDTH}
        collapsedWidth={SIDEBAR_COLLAPSED}
        showSearch
      />
      <TeacherSidebar open={open} onToggle={() => setOpen((s) => !s)} />
      <Box component="main" sx={{ flexGrow: 1, pt: 8, px: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default TeacherLayout;
