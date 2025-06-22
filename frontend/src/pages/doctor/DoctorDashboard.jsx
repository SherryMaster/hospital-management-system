/**
 * DoctorDashboard Component
 * 
 * Doctor-specific dashboard with appointment schedule, patient list, and quick actions
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  LinearProgress,
  Badge,
  Paper,
  Alert,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Phone as PhoneIcon,
  VideoCall as VideoCallIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard, useAppointments, usePatients } from '../../hooks/useApi';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    stats,
    todayAppointments,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboard();

  const {
    appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
    fetchAppointments,
  } = useAppointments();

  const {
    patients,
    loading: patientsLoading,
    error: patientsError,
    fetchPatients,
  } = usePatients();

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Load doctor's appointments for today
    const today = new Date().toISOString().split('T')[0];
    fetchAppointments({
      doctor: user?.id,
      date: today,
    });

    // Load recent patients
    fetchPatients({
      doctor: user?.id,
      page_size: 5,
      ordering: '-last_visit_date',
    });

    // Mock notifications for now
    setNotifications([
      { id: 1, message: 'New appointment request pending approval', time: '10 min ago', type: 'appointment' },
      { id: 2, message: 'Lab results available for review', time: '1 hour ago', type: 'lab' },
      { id: 3, message: 'Prescription refill request', time: '2 hours ago', type: 'prescription' },
    ]);
  }, [user, fetchAppointments, fetchPatients]);

  const loading = dashboardLoading || appointmentsLoading || patientsLoading;
  const error = dashboardError || appointmentsError || patientsError;

  // Calculate today's stats from appointments
  const todayStats = {
    totalAppointments: appointments?.length || 0,
    completedAppointments: appointments?.filter(apt => apt.status === 'completed').length || 0,
    upcomingAppointments: appointments?.filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed').length || 0,
    cancelledAppointments: appointments?.filter(apt => apt.status === 'cancelled').length || 0,
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleRefresh = () => {
    refetchDashboard();
    const today = new Date().toISOString().split('T')[0];
    fetchAppointments({
      doctor: user?.id,
      date: today,
    });
    fetchPatients({
      doctor: user?.id,
      page_size: 5,
      ordering: '-last_visit_date',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'scheduled':
      case 'confirmed': return 'primary';
      case 'cancelled': return 'error';
      case 'in-progress': return 'warning';
      default: return 'default';
    }
  };

  const getAppointmentTypeIcon = (type) => {
    switch (type) {
      case 'consultation': return <AssignmentIcon />;
      case 'follow-up': return <ScheduleIcon />;
      case 'check-up': return <HospitalIcon />;
      default: return <CalendarIcon />;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
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
          <Box>
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
    </Card>
  );

  if (loading) {
    return (
      <MainLayout user={user} onLogout={logout}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Doctor Dashboard
          </Typography>
          <LinearProgress sx={{ mb: 3 }} />
          <Typography variant="body1" color="text.secondary">
            Loading your schedule...
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Good morning, Dr. {user?.last_name || user?.full_name?.split(' ')[1] || 'Doctor'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's your schedule for today, {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Today's Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Appointments"
              value={todayStats.totalAppointments}
              icon={<CalendarIcon />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Completed"
              value={todayStats.completedAppointments}
              icon={<HospitalIcon />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Upcoming"
              value={todayStats.upcomingAppointments}
              icon={<ScheduleIcon />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Cancelled"
              value={todayStats.cancelledAppointments}
              icon={<TimeIcon />}
              color="error"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Today's Appointments */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Today's Appointments
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleNavigation('/appointments/book')}
                  >
                    Add Appointment
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {appointments && appointments.length > 0 ? (
                    appointments.map((appointment, index) => (
                      <React.Fragment key={appointment.id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {getAppointmentTypeIcon(appointment.appointment_type)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>
                                  {appointment.patient?.full_name || 'Unknown Patient'}
                                </span>
                                <Chip
                                  label={appointment.status}
                                  size="small"
                                  color={getStatusColor(appointment.status)}
                                  variant="outlined"
                                />
                              </Box>
                            }
                            secondary={`${formatTime(appointment.appointment_time)} • ${appointment.appointment_type || 'consultation'}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" color="primary">
                              <PhoneIcon />
                            </IconButton>
                            <IconButton edge="end" color="primary">
                              <VideoCallIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < appointments.length - 1 && <Divider />}
                      </React.Fragment>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No appointments scheduled for today
                    </Typography>
                  )}
                </List>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<CalendarIcon />}
                  onClick={() => handleNavigation('/appointments/calendar')}
                >
                  View Full Schedule
                </Button>
                <Button
                  size="small"
                  onClick={() => handleNavigation('/doctor/availability')}
                >
                  Manage Availability
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Recent Patients */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Patients
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  {patients && patients.length > 0 ? (
                    patients.map((patient, index) => (
                      <React.Fragment key={patient.id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                              <PersonIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={patient.user?.full_name || 'Unknown Patient'}
                            secondary={
                              <React.Fragment>
                                <span style={{ display: 'block', fontSize: '0.75rem' }}>
                                  Last visit: {formatDate(patient.last_visit_date)}
                                </span>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#1976d2' }}>
                                  {patient.chronic_conditions || 'No conditions noted'}
                                </span>
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                        {index < patients.length - 1 && <Divider />}
                      </React.Fragment>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No recent patients
                    </Typography>
                  )}
                </List>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<PeopleIcon />}
                  onClick={() => handleNavigation('/patients')}
                >
                  View All Patients
                </Button>
              </CardActions>
            </Card>

            {/* Notifications */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Badge badgeContent={notifications.length} color="error">
                    <NotificationsIcon />
                  </Badge>
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Notifications
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  {notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                      <React.Fragment key={notification.id}>
                        <ListItem>
                          <ListItemText
                            primary={notification.message}
                            secondary={notification.time}
                          />
                        </ListItem>
                        {index < notifications.length - 1 && <Divider />}
                      </React.Fragment>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No new notifications
                    </Typography>
                  )}
                </List>
              </CardContent>
              <CardActions>
                <Button size="small">View All</Button>
                <Button size="small">Mark as Read</Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ py: 1.5 }}
                onClick={() => handleNavigation('/appointments/book')}
              >
                New Appointment
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AssignmentIcon />}
                sx={{ py: 1.5 }}
                onClick={() => handleNavigation('/patients')}
              >
                Patient Records
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ScheduleIcon />}
                sx={{ py: 1.5 }}
                onClick={() => handleNavigation('/doctor/availability')}
              >
                Set Availability
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<TrendingUpIcon />}
                sx={{ py: 1.5 }}
                onClick={() => handleNavigation('/reports')}
              >
                View Reports
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default DoctorDashboard;
