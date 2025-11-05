
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
  Toolbar,
} from '@mui/material';
import {
  Home as HomeIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Article as ArticleIcon,
  Category as CategoryIcon,
  Reviews as ReviewsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { NavLink } from 'react-router-dom';

type SidebarProps = {
  open: boolean;
  onToggle: () => void;
  sidebarWidth?: number;
  collapsedWidth?: number;
};

const drawerWidth = 240;
const collapsed = 72;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const MuiSidebar: React.FC<SidebarProps> = ({
  open,
  onToggle,
  sidebarWidth = drawerWidth,
  collapsedWidth = collapsed,
}) => {
  const theme = useTheme();

  const items = [
    { label: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { label: 'Tài khoản', path: 'manage-users', icon: PeopleIcon },
    { label: 'Sách ', path: 'manage-books', icon: ArticleIcon },
    { label: 'Đơn hàng', path: 'manage-orders', icon: ShoppingCartIcon },
    { label: 'Khóa học', path: 'manage-courses', icon: ArticleIcon },
    { label: 'Danh mục', path: 'manage-categories', icon: CategoryIcon },
    { label: 'Đánh giá', path: 'manage-reviews', icon: ReviewsIcon },

    
    { label: 'Pending edits', path: 'pending-edits', icon: ArticleIcon },

  ] as const;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? sidebarWidth : collapsedWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? sidebarWidth : collapsedWidth,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
      open={open}
    >
      {/* Keep space for AppBar */}
      <Toolbar />
      <Divider />
      <List sx={{ px: 1 }}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2,
                  borderRadius: 1.5,
                  '&.active': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : 'auto',
                    justifyContent: 'center',
                    color: 'text.secondary',
                  }}
                >
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{ opacity: open ? 1 : 0 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ mt: 'auto' }} />
      <DrawerHeader>
        <IconButton onClick={onToggle}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </DrawerHeader>
    </Drawer>
  );
};

export default MuiSidebar;
