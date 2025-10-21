import React, { useMemo, useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  Tooltip,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

type TeacherNavbarProps = {
  onToggleDrawer: () => void;
  isSidebarOpen: boolean;
  sidebarWidth?: number;
  collapsedWidth?: number;
  title?: string;
};

const TeacherNavbar: React.FC<TeacherNavbarProps> = ({
  onToggleDrawer,
  isSidebarOpen,
  sidebarWidth = 240,
  collapsedWidth = 72,
  title,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  // Đồng hồ thời gian thực
  const [now, setNow] = useState('');
  useEffect(() => {
    const update = () => {
      const d = new Date();
      const s = d.toLocaleTimeString('vi-VN', { hour12: false });
      const date = d.toLocaleDateString('vi-VN');
      setNow(`${s} • ${date}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Tự động tạo tiêu đề theo URL nếu không truyền prop
  const computedTitle = useMemo(() => {
    if (title) return title;
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length <= 1) return 'Bảng điều khiển';
    const last = parts[parts.length - 1];
    return last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }, [location.pathname, title]);

  const appBarWidth = isSidebarOpen
    ? `calc(100% - ${sidebarWidth}px)`
    : `calc(100% - ${collapsedWidth}px)`;
  const marginLeft = isSidebarOpen ? `${sidebarWidth}px` : `${collapsedWidth}px`;

  const handleLogout = () => {
    logout?.();
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      elevation={3}
      sx={{
        width: { sm: appBarWidth },
        ml: { sm: marginLeft },
        backgroundColor: 'white',
        color: 'text.primary',
        zIndex: (t) => t.zIndex.drawer + 1,
        transition: theme.transitions.create(['width', 'margin-left'], {
          duration: theme.transitions.duration.standard,
        }),
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Nút toggle Sidebar + Tiêu đề */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title={isSidebarOpen ? 'Thu gọn menu' : 'Mở rộng menu'}>
            <IconButton edge="start" color="inherit" onClick={onToggleDrawer}>
              <MenuIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" fontWeight={700} noWrap>
            {computedTitle}
          </Typography>
        </Box>

        {/* Bên phải */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
            {now}
          </Typography>

          <Tooltip title="Thông báo">
            <IconButton color="inherit">
              <Badge color="error" variant="dot">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Cài đặt">
            <IconButton color="inherit" onClick={() => navigate('/teacher/settings')}>
              <SettingsOutlinedIcon />
            </IconButton>
          </Tooltip>

          {/* Menu người dùng */}
          <Tooltip title={user?.fullName || 'Tài khoản'}>
            <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar
                alt={user?.fullName || 'User'}
                src={user?.avatarUrl}
                sx={{ width: 32, height: 32 }}
              />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled>
              <Box>
                <Typography fontWeight={600}>{user?.fullName || 'User'}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => { navigate('/teacher/profile'); setAnchorEl(null); }}>
              <SettingsOutlinedIcon fontSize="small" style={{ marginRight: 8 }} /> Hồ sơ
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" style={{ marginRight: 8 }} /> Đăng xuất
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TeacherNavbar;
