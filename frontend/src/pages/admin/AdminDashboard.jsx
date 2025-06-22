/**
 * AdminDashboard Component
 * 
 * Comprehensive admin dashboard with user management, system overview, and analytics
 */

import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      totalPatients: 0,
      totalDoctors: 0,
      totalAppointments: 0,
      pendingAppointments: 0,
      totalRevenue: 0,
      pendingInvoices: 0,
    },
    recentUsers: [],
    systemHealth: {
      status: 'healthy',
      uptime: '99.9%',
      responseTime: '120ms',
    },
    alerts: [],
  });
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      // Simulated data for now
      setTimeout(() => {
        setDashboardData({
          stats: {
            totalUsers: 156,
            totalPatients: 89,
            totalDoctors: 12,
            totalAppointments: 234,
            pendingAppointments: 18,
            totalRevenue: 45670.50,
            pendingInvoices: 7,
          },
          recentUsers: [
            { id: 1, name: 'John Doe', role: 'patient', email: 'john@example.com', joinedAt: '2024-01-15' },
            { id: 2, name: 'Dr. Smith', role: 'doctor', email: 'smith@hospital.com', joinedAt: '2024-01-14' },
            { id: 3, name: 'Jane Wilson', role: 'nurse', email: 'jane@hospital.com', joinedAt: '2024-01-13' },
          ],
          systemHealth: {
            status: 'healthy',
            uptime: '99.9%',
            responseTime: '120ms',
          },
          alerts: [
            { id: 1, type: 'warning', message: '7 pending invoices require attention', priority: 'medium' },
            { id: 2, type: 'info', message: 'System backup completed successfully', priority: 'low' },
          ],
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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

  const StatCard = ({ title, value, icon, color, subtitle, action }) => (
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
          <Button size="small" color={color}>
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
            <IconButton onClick={loadDashboardData} color="primary">
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
              <MenuItem onClick={handleMenuClose}>
                <SettingsIcon sx={{ mr: 1 }} />
                System Settings
              </MenuItem>
              <MenuItem onClick={handleMenuClose}>
                <PeopleIcon sx={{ mr: 1 }} />
                User Management
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* System Alerts */}
        {dashboardData.alerts.length > 0 && (
          <Box sx={{ mb: 4 }}>
            {dashboardData.alerts.map((alert) => (
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
              value={dashboardData.stats.totalUsers}
              icon={<PeopleIcon />}
              color="primary"
              action="Manage Users"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Patients"
              value={dashboardData.stats.totalPatients}
              icon={<HospitalIcon />}
              color="success"
              action="View Patients"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Available Doctors"
              value={dashboardData.stats.totalDoctors}
              icon={<PeopleIcon />}
              color="info"
              action="View Doctors"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Appointments"
              value={dashboardData.stats.totalAppointments}
              icon={<CalendarIcon />}
              color="secondary"
              subtitle={`${dashboardData.stats.pendingAppointments} pending`}
              action="View Calendar"
            />
          </Grid>
        </Grid>

        {/* Revenue and Financial Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Revenue"
              value={`$${dashboardData.stats.totalRevenue.toLocaleString()}`}
              icon={<TrendingUpIcon />}
              color="success"
              action="View Reports"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Pending Invoices"
              value={dashboardData.stats.pendingInvoices}
              icon={<ReceiptIcon />}
              color="warning"
              action="Review Invoices"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="System Health"
              value={dashboardData.systemHealth.status.toUpperCase()}
              icon={<CheckCircleIcon />}
              color="success"
              subtitle={`Uptime: ${dashboardData.systemHealth.uptime}`}
              action="View Details"
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
                {dashboardData.recentUsers.map((user, index) => (
                  <Box key={user.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {user.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1">{user.name}</Typography>
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
                    {index < dashboardData.recentUsers.length - 1 && <Divider />}
                  </Box>
                ))}
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<PersonAddIcon />}>
                  Add New User
                </Button>
                <Button size="small">View All Users</Button>
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
                    >
                      Add User
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<CalendarIcon />}
                      sx={{ mb: 1 }}
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
