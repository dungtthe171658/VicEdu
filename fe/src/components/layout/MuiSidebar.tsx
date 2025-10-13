import React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import {
  Drawer,
  List,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Article as ArticleIcon,
  ShoppingCart as ShoppingCartIcon,
  TableChart as TableChartIcon, // Đã import icon này
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth'; // Giả định có hook này

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

// Định nghĩa các mục menu, gán role cần thiết (chỉ Admin có quyền quản lý đa số mục)
const menuItemsMap = {
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon },
    { label: 'User Management', path: '/admin/manage-users', icon: PeopleIcon }, // UC01
    { label: 'Course Management', path: '/admin/manage-courses', icon: ArticleIcon }, // UC02
    { label: 'Product (Book) Management', path: '/admin/manage-books', icon: SettingsIcon }, // UC03
    { label: 'Order Management', path: '/admin/manage-orders', icon: ShoppingCartIcon }, // UC05
    { label: 'Review Management', path: '/admin/manage-reviews', icon: TableChartIcon }, // UC06
    { label: 'Categories', path: '/admin/manage-categories', icon: TableChartIcon }, // Quản lý danh mục
  ],
  teacher: [
    { label: 'Teacher Dashboard', path: '/teacher/dashboard', icon: HomeIcon },
    { label: 'My Courses', path: '/teacher/my-courses', icon: ArticleIcon },
    // ... Thêm mục cho Teacher nếu cần
  ]
};

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const MuiSidebar: React.FC<SidebarProps> = ({ open, onToggle }) => {
  const theme = useTheme();
  const { user } = useAuth(); 
  
  // Xác định menu dựa trên role (Ưu tiên Admin cho các trang Admin đã tạo)
  const itemsToShow = user?.role === 'admin' ? menuItemsMap.admin : menuItemsMap.teacher;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : 72,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          backgroundColor: theme.palette.background.default,
          borderRight: `1px solid ${theme.palette.divider}`,
          position: 'relative',
          height: '100%',
        },
      }}
      open={open}
    >
      <DrawerHeader>
        <IconButton onClick={onToggle}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        {itemsToShow.map((item) => {
          const Icon = item.icon;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component="a"
                href={item.path}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  <Icon />
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  sx={{ 
                    opacity: open ? 1 : 0,
                    transition: theme.transitions.create('opacity', {
                      duration: theme.transitions.duration.shortest,
                    }),
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default MuiSidebar;