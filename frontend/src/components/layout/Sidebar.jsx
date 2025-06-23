/**
 * Sidebar Component
 * 
 * Navigation sidebar with role-based menu items
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocalHospital as LocalHospitalIcon,
  CalendarToday as CalendarTodayIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  MedicalServices as MedicalServicesIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

const Sidebar = ({ user, onItemClick }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    if (onItemClick) {
      onItemClick();
    }
  };

  const getUserInitials = (user) => {
    if (!user) return 'U';
    const firstName = user.first_name || user.full_name?.split(' ')[0] || '';
    const lastName = user.last_name || user.full_name?.split(' ')[1] || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  const getUserDisplayName = (user) => {
    if (!user) return 'User';
    return user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'User';
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'error';
      case 'doctor':
        return 'primary';
      case 'nurse':
        return 'secondary';
      case 'patient':
        return 'success';
      case 'receptionist':
        return 'info';
      case 'pharmacist':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Define navigation items based on user role
  const getNavigationItems = (userRole) => {
    const commonItems = [
      {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/dashboard',
        roles: ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist'],
      },
    ];

    const adminItems = [
      {
        text: 'Users',
        icon: <PeopleIcon />,
        path: '/users',
        roles: ['admin'],
      },
      {
        text: 'Analytics',
        icon: <AnalyticsIcon />,
        path: '/analytics',
        roles: ['admin'],
      },
    ];

    const medicalItems = [
      {
        text: 'Patients',
        icon: <LocalHospitalIcon />,
        path: '/patients',
        roles: ['admin', 'doctor', 'nurse', 'receptionist'],
      },
      {
        text: 'Doctors',
        icon: <MedicalServicesIcon />,
        path: '/doctors',
        roles: ['admin', 'receptionist'],
      },
      {
        text: 'Book Appointment',
        icon: <CalendarTodayIcon />,
        path: '/appointments/book',
        roles: ['patient'],
      },
      {
        text: 'Appointment Calendar',
        icon: <CalendarTodayIcon />,
        path: '/appointments/calendar',
        roles: ['admin', 'doctor', 'nurse', 'receptionist', 'patient'],
      },
      {
        text: 'Manage Appointments',
        icon: <CalendarTodayIcon />,
        path: '/appointments/manage',
        roles: ['admin', 'doctor', 'nurse', 'receptionist'],
      },
      {
        text: 'Medical Records',
        icon: <AssignmentIcon />,
        path: '/medical-records',
        roles: ['admin', 'doctor', 'nurse'],
      },
    ];

    const billingItems = [
      {
        text: 'Billing',
        icon: <ReceiptIcon />,
        path: '/billing',
        roles: ['admin', 'receptionist'],
      },
    ];

    const patientItems = [
      {
        text: 'Patient Portal',
        icon: <PersonIcon />,
        path: '/patient/portal',
        roles: ['patient'],
      },
      {
        text: 'My Profile',
        icon: <PersonIcon />,
        path: '/patient/profile',
        roles: ['patient'],
      },
      {
        text: 'My Appointments',
        icon: <CalendarTodayIcon />,
        path: '/my-appointments',
        roles: ['patient'],
      },
      {
        text: 'My Invoices',
        icon: <ReceiptIcon />,
        path: '/my-invoices',
        roles: ['patient'],
      },
    ];

    const doctorItems = [
      {
        text: 'Doctor Portal',
        icon: <MedicalServicesIcon />,
        path: '/doctor/portal',
        roles: ['doctor'],
      },
    ];

    const settingsItems = [
      {
        text: 'Settings',
        icon: <SettingsIcon />,
        path: '/settings',
        roles: ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'patient'],
      },
    ];

    const allItems = [
      ...commonItems,
      ...adminItems,
      ...medicalItems,
      ...billingItems,
      ...doctorItems,
      ...patientItems,
      ...settingsItems,
    ];

    // Filter items based on user role
    return allItems.filter(item => 
      item.roles.includes(userRole?.toLowerCase())
    );
  };

  const navigationItems = getNavigationItems(user?.role);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Toolbar>
        <Typography variant="h6" noWrap component="div" color="primary" fontWeight="bold">
          HMS
        </Typography>
      </Toolbar>
      
      <Divider />

      {/* User Info */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {getUserInitials(user)}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {getUserDisplayName(user)}
            </Typography>
            <Chip
              label={user?.role || 'User'}
              size="small"
              color={getRoleColor(user?.role)}
              variant="outlined"
            />
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Navigation Items */}
      <List sx={{ flexGrow: 1, py: 1 }}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActive}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'inherit' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Hospital Management System
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          v1.0.0
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;
