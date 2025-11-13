import React, { useMemo, useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  InputBase,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

type TeacherNavbarProps = {
  onToggleDrawer: () => void;
  isSidebarOpen: boolean;
  sidebarWidth?: number;
  collapsedWidth?: number;
  title?: string;
  showSearch?: boolean;
  rightActions?: React.ReactNode;
  showBack?: boolean;
};

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 999,
  backgroundColor: theme.palette.mode === 'light' ? '#f1f5f9' : theme.palette.grey[800],
  '&:hover': {
    backgroundColor: theme.palette.mode === 'light' ? '#e5e7eb' : theme.palette.grey[700],
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
    minWidth: 280,
  },
  border: `1px solid ${theme.palette.divider}`,
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.2, 1.2, 1.2, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
  },
}));

const TeacherNavbar: React.FC<TeacherNavbarProps> = ({
  onToggleDrawer,
  isSidebarOpen,
  sidebarWidth = 240,
  collapsedWidth = 72,
  title,
  showSearch = true,
  rightActions,
  showBack = false,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Realtime clock
  const [now, setNow] = useState<string>('');
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const s = d.toLocaleTimeString('vi-VN', { hour12: false });
      const date = d.toLocaleDateString('vi-VN');
      setNow(`${s} • ${date}`);
    };
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);

  const computedTitle = useMemo(() => {
    if (title) return title;
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length <= 1) return 'Teacher Panel';
    const last = parts[parts.length - 1];
    return last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }, [location.pathname, title]);

  const appBarWidth = isSidebarOpen ? `calc(100% - ${sidebarWidth}px)` : `calc(100% - ${collapsedWidth}px)`;
  const marginLeft = isSidebarOpen ? `${sidebarWidth}px` : `${collapsedWidth}px`;

  const handleLogout = () => {
    logout?.();
    navigate('/login');
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => setAnchorEl(null);

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
      <Toolbar>
        {/* Left controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {showBack && (
            <Tooltip title="Quay lại">
              <IconButton edge="start" color="inherit" onClick={() => navigate(-1)}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={isSidebarOpen ? 'Thu gọn menu' : 'Mở rộng menu'}>
            <IconButton edge="start" color="inherit" onClick={onToggleDrawer}>
              <MenuIcon />
            </IconButton>
          </Tooltip>
          <Typography variant={isSmDown ? 'subtitle1' : 'h6'} fontWeight={700} noWrap sx={{ ml: 0.5 }}>
            {computedTitle}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {showSearch && !isSmDown && (
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase placeholder="Tìm kiếm…" inputProps={{ 'aria-label': 'search' }} />
          </Search>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {/* Right actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Realtime clock */}
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
            {now}
          </Typography>

          {rightActions}

          {/* <Tooltip title="Thông báo">
            <IconButton color="inherit">
              <Badge color="error" variant="dot">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip> */}

          {/* <Tooltip title="Cài đặt">
            <IconButton color="inherit" onClick={() => navigate('/teacher/settings')}>
              <SettingsOutlinedIcon />
            </IconButton>
          </Tooltip> */}

          {/* Profile */}
          <Tooltip title={user?.name || 'Tài khoản'}>
            <IconButton color="inherit" onClick={handleOpenMenu} sx={{ ml: 0.5 }}>
              <Avatar alt={user?.name || 'User'} src={user?.avatar} sx={{ width: 32, height: 32 }} />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleCloseMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            keepMounted
          >
            <MenuItem disabled>
              <Box>
                <Typography fontWeight={600}>{user?.name || 'User'}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => { navigate('/teacher/profile'); handleCloseMenu(); }}>
              <SettingsOutlinedIcon fontSize="small" style={{ marginRight: 8 }} /> Hồ sơ
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" style={{ marginRight: 8 }} /> Đăng xuất
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {showSearch && isSmDown && (
        <Box px={2} pb={1.5}>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase placeholder="Tìm kiếm…" inputProps={{ 'aria-label': 'search' }} />
          </Search>
        </Box>
      )}
    </AppBar>
  );
};

export default TeacherNavbar;