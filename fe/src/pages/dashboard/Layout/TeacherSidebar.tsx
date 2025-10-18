import React from 'react';
import {
  Drawer,
  List,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  Home as HomeIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
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

const TeacherSidebar: React.FC<SidebarProps> = ({
  open,
  onToggle,
  sidebarWidth = drawerWidth,
  collapsedWidth = collapsed,
}) => {
  const theme = useTheme();

  const items = [
    { label: 'Tổng quan', path: '/teacher/dashboard', icon: HomeIcon },
    { label: 'Lớp học của tôi', path: '/teacher/classes', icon: SchoolIcon },
    { label: 'Học sinh', path: '/teacher/students', icon: PeopleIcon },
    { label: 'Bài tập / Đánh giá', path: '/teacher/assignments', icon: AssignmentIcon },
  ];

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
        },
      }}
      open={open}
    >
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

export default TeacherSidebar;
