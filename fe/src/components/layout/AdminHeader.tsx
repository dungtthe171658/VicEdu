import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Menu, MenuItem, Avatar } from '@mui/material';
import { Menu as MenuIcon, Notifications as NotificationsIcon, Logout as LogoutIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Navigate } from 'react-router-dom'; // Cần cho AdminProtectedRoute

interface AdminHeaderProps {
  onToggleDrawer: () => void;
  isSidebarOpen: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleDrawer, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Cấu hình chiều rộng của AppBar dựa trên trạng thái Sidebar
  const appBarWidth = isSidebarOpen ? 'calc(100% - 240px)' : 'calc(100% - 72px)';
  const marginLeft = isSidebarOpen ? '240px' : '72px';

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        width: appBarWidth, 
        ml: marginLeft,
        transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms, margin-left 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'white',
        color: 'black',
        boxShadow: 3,
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onToggleDrawer}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Admin Panel
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <NotificationsIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              {user?.fullName || 'Admin'}
            </Typography>
            <IconButton onClick={handleMenuClick} color="inherit">
              <Avatar alt={user?.fullName} src={user?.avatarUrl} />
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            keepMounted
          >
            <MenuItem onClick={() => {
                navigate('/admin/profile'); // Giả sử có trang profile admin
                handleMenuClose();
            }}>
                <SettingsIcon sx={{ mr: 1 }} /> Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AdminHeader;