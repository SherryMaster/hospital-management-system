/**
 * AdminDashboard Component
 * 
 * Comprehensive admin dashboard with user management, system overview, and analytics
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  LocalHospital as HospitalIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../hooks/useApi';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    stats,
    recentUsers,
    systemHealth,
    todayAppointments,
    loading,
    error,
    refetch,
  } = useDashboard();

  const [anchorEl, setAnchorEl] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Generate alerts based on dashboard data
    const newAlerts = [];

    if (stats?.pendingInvoices > 0) {
      newAlerts.push({
        id: 1,
        type: 'warning',
        message: `${stats.pendingInvoices} pending invoices require attention`,
        priority: 'medium'
      });
    }

    if (stats?.pendingAppointments > 10) {
      newAlerts.push({
        id: 2,
        type: 'info',
        message: `${stats.pendingAppointments} appointments pending confirmation`,
        priority: 'low'
      });
    }

    if (systemHealth?.status === 'healthy') {
      newAlerts.push({
        id: 3,
        type: 'success',
        message: 'All systems operational',
        priority: 'low'
      });
    }

    setAlerts(newAlerts);
  }, [stats, systemHealth]);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleRefresh = () => {
    refetch();
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'error';
      case 'doctor': return 'primary';
      case 'nurse': return 'secondary';
      case 'patient': return 'success';
      case 'receptionist': return 'info';
      case 'pharmacist': return 'warning';
      default: return 'default';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning': return <WarningIcon color="warning" />;
      case 'error': return <WarningIcon color="error" />;
      case 'success': return <CheckCircleIcon color="success" />;
      default: return <CheckCircleIcon color="info" />;
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle, action, onActionClick }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="div" color={`${color}.main`}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
      {action && (
        <CardActions>
          <Button size="small" color={color} onClick={onActionClick}>
            {action}
          </Button>
        </CardActions>
      )}
    </Card>
  );

  if (loading) {
    return (
      <MainLayout user={user} onLogout={logout}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Admin Dashboard
          </Typography>
          <LinearProgress sx={{ mb: 3 }} />
          <Typography variant="body1" color="text.secondary">
            Loading dashboard data...
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              System overview and management tools
            </Typography>
          </Box>
          <Box>
            <IconButton onClick={handleRefresh} color="primary" disabled={loading}>
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { handleMenuClose(); handleNavigation('/settings'); }}>
                <SettingsIcon sx={{ mr: 1 }} />
                System Settings
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); handleNavigation('/users'); }}>
                <PeopleIcon sx={{ mr: 1 }} />
                User Management
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); handleNavigation('/departments'); }}>
                <BusinessIcon sx={{ mr: 1 }} />
                Department Management
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* System Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}
        {alerts.length > 0 && (
          <Box sx={{ mb: 4 }}>
            {alerts.map((alert) => (
              <Alert
                key={alert.id}
                severity={alert.type}
                icon={getAlertIcon(alert.type)}
                sx={{ mb: 1 }}
              >
                {alert.message}
              </Alert>
            ))}
          </Box>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              icon={<PeopleIcon />}
              color="primary"
              action="Manage Users"
              onActionClick={() => handleNavigation('/users')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Patients"
              value={stats?.totalPatients || 0}
              icon={<HospitalIcon />}
              color="success"
              action="View Patients"
              onActionClick={() => handleNavigation('/patients')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Available Doctors"
              value={stats?.totalDoctors || 0}
              icon={<PeopleIcon />}
              color="info"
              action="View Doctors"
              onActionClick={() => handleNavigation('/doctors')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Appointments"
              value={stats?.totalAppointments || 0}
              icon={<CalendarIcon />}
              color="secondary"
              subtitle={stats?.pendingAppointments ? `${stats.pendingAppointments} pending` : ''}
              action="View Calendar"
              onActionClick={() => handleNavigation('/appointments/calendar')}
            />
          </Grid>
        </Grid>

        {/* Revenue and Financial Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Revenue"
              value={stats?.totalRevenue ? `$${stats.totalRevenue.toLocaleString()}` : '$0'}
              icon={<TrendingUpIcon />}
              color="success"
              action="View Reports"
              onActionClick={() => handleNavigation('/billing')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Pending Invoices"
              value={stats?.pendingInvoices || 0}
              icon={<ReceiptIcon />}
              color="warning"
              action="Review Invoices"
              onActionClick={() => handleNavigation('/billing')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="System Health"
              value={systemHealth?.status?.toUpperCase() || 'UNKNOWN'}
              icon={<CheckCircleIcon />}
              color={systemHealth?.status === 'healthy' ? 'success' : 'error'}
              subtitle={systemHealth?.uptime ? `Uptime: ${systemHealth.uptime}` : ''}
              action="View Details"
              onActionClick={() => handleNavigation('/system-health')}
            />
          </Grid>
        </Grid>

        {/* Recent Users */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Users
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {recentUsers && recentUsers.length > 0 ? (
                  recentUsers.map((user, index) => (
                    <Box key={user.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {(user.full_name || user.first_name || user.email || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1">
                            {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                        <Chip
                          label={user.role}
                          size="small"
                          color={getRoleColor(user.role)}
                          variant="outlined"
                        />
                      </Box>
                      {index < recentUsers.length - 1 && <Divider />}
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No recent users to display
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={() => handleNavigation('/users')}
                >
                  Add New User
                </Button>
                <Button
                  size="small"
                  onClick={() => handleNavigation('/users')}
                >
                  View All Users
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<PersonAddIcon />}
                      sx={{ mb: 1 }}
                      onClick={() => handleNavigation('/users')}
                    >
                      Add User
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<BusinessIcon />}
                      sx={{ mb: 1 }}
                      onClick={() => handleNavigation('/departments')}
                    >
                      Departments
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<CalendarIcon />}
                      sx={{ mb: 1 }}
                      onClick={() => handleNavigation('/appointments/calendar')}
                    >
                      View Calendar
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ReceiptIcon />}
                      sx={{ mb: 1 }}
                      onClick={() => handleNavigation('/billing')}
                    >
                      Billing
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<TrendingUpIcon />}
                      sx={{ mb: 1 }}
                      onClick={() => handleNavigation('/analytics')}
                    >
                      Analytics
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
};

export default AdminDashboard;
