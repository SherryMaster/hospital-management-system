/**
 * DoctorDashboard Component
 * 
 * Doctor-specific dashboard with appointment schedule, patient list, and quick actions
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

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    todayStats: {
      totalAppointments: 0,
      completedAppointments: 0,
      upcomingAppointments: 0,
      cancelledAppointments: 0,
    },
    todayAppointments: [],
    recentPatients: [],
    notifications: [],
  });

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
          todayStats: {
            totalAppointments: 8,
            completedAppointments: 3,
            upcomingAppointments: 4,
            cancelledAppointments: 1,
          },
          todayAppointments: [
            {
              id: 1,
              patient: 'John Doe',
              time: '09:00 AM',
              type: 'consultation',
              status: 'completed',
              duration: '30 min',
            },
            {
              id: 2,
              patient: 'Jane Smith',
              time: '10:30 AM',
              type: 'follow-up',
              status: 'completed',
              duration: '20 min',
            },
            {
              id: 3,
              patient: 'Mike Johnson',
              time: '02:00 PM',
              type: 'consultation',
              status: 'upcoming',
              duration: '30 min',
            },
            {
              id: 4,
              patient: 'Sarah Wilson',
              time: '03:30 PM',
              type: 'check-up',
              status: 'upcoming',
              duration: '45 min',
            },
          ],
          recentPatients: [
            {
              id: 1,
              name: 'John Doe',
              lastVisit: '2024-01-15',
              condition: 'Hypertension',
              nextAppointment: '2024-01-22',
            },
            {
              id: 2,
              name: 'Jane Smith',
              lastVisit: '2024-01-14',
              condition: 'Diabetes',
              nextAppointment: '2024-01-21',
            },
            {
              id: 3,
              name: 'Mike Johnson',
              lastVisit: '2024-01-13',
              condition: 'Regular Checkup',
              nextAppointment: null,
            },
          ],
          notifications: [
            { id: 1, message: 'New appointment request from Emma Davis', time: '10 min ago', type: 'appointment' },
            { id: 2, message: 'Lab results available for John Doe', time: '1 hour ago', type: 'lab' },
            { id: 3, message: 'Prescription refill request from Jane Smith', time: '2 hours ago', type: 'prescription' },
          ],
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'upcoming': return 'primary';
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

        {/* Today's Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Appointments"
              value={dashboardData.todayStats.totalAppointments}
              icon={<CalendarIcon />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Completed"
              value={dashboardData.todayStats.completedAppointments}
              icon={<HospitalIcon />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Upcoming"
              value={dashboardData.todayStats.upcomingAppointments}
              icon={<ScheduleIcon />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Cancelled"
              value={dashboardData.todayStats.cancelledAppointments}
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
                  >
                    Add Appointment
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {dashboardData.todayAppointments.map((appointment, index) => (
                    <React.Fragment key={appointment.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {getAppointmentTypeIcon(appointment.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>
                                {appointment.patient}
                              </span>
                              <Chip
                                label={appointment.status}
                                size="small"
                                color={getStatusColor(appointment.status)}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={`${appointment.time} • ${appointment.duration} • ${appointment.type}`}
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
                      {index < dashboardData.todayAppointments.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<CalendarIcon />}>
                  View Full Schedule
                </Button>
                <Button size="small">Manage Availability</Button>
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
                  {dashboardData.recentPatients.map((patient, index) => (
                    <React.Fragment key={patient.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={patient.name}
                          secondary={
                            <React.Fragment>
                              <span style={{ display: 'block', fontSize: '0.75rem' }}>
                                Last visit: {patient.lastVisit}
                              </span>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#1976d2' }}>
                                {patient.condition}
                              </span>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      {index < dashboardData.recentPatients.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<PeopleIcon />}>
                  View All Patients
                </Button>
              </CardActions>
            </Card>

            {/* Notifications */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Badge badgeContent={dashboardData.notifications.length} color="error">
                    <NotificationsIcon />
                  </Badge>
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Notifications
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  {dashboardData.notifications.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <ListItem>
                        <ListItemText
                          primary={notification.message}
                          secondary={notification.time}
                        />
                      </ListItem>
                      {index < dashboardData.notifications.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
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
