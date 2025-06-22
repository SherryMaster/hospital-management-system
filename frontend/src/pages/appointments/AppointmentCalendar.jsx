/**
 * AppointmentCalendar Component
 * 
 * Calendar component for viewing and managing appointments with different views (day/week/month)
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  Badge,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  ViewDay as ViewDayIcon,
  ViewWeek as ViewWeekIcon,
  ViewModule as ViewModuleIcon,
} from '@mui/icons-material';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';

const AppointmentCalendar = () => {
  const { user, logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'day', 'week', 'month'
  const [selectedDate, setSelectedDate] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [currentDate, viewMode]);

  const loadAppointments = async () => {
    try {
      // TODO: Replace with actual API call
      // Simulated data for now
      const mockAppointments = [
        {
          id: 1,
          patient: 'John Doe',
          doctor: 'Dr. Smith',
          date: '2024-01-25',
          time: '09:00 AM',
          duration: 30,
          type: 'consultation',
          status: 'confirmed',
          department: 'Cardiology',
        },
        {
          id: 2,
          patient: 'Jane Wilson',
          doctor: 'Dr. Johnson',
          date: '2024-01-25',
          time: '10:30 AM',
          duration: 45,
          type: 'follow-up',
          status: 'pending',
          department: 'General Medicine',
        },
        {
          id: 3,
          patient: 'Mike Brown',
          doctor: 'Dr. Davis',
          date: '2024-01-26',
          time: '02:00 PM',
          duration: 30,
          type: 'check-up',
          status: 'confirmed',
          department: 'Dermatology',
        },
        {
          id: 4,
          patient: 'Sarah Miller',
          doctor: 'Dr. Wilson',
          date: '2024-01-26',
          time: '03:30 PM',
          duration: 60,
          type: 'consultation',
          status: 'completed',
          department: 'Orthopedics',
        },
        {
          id: 5,
          patient: 'David Anderson',
          doctor: 'Dr. Taylor',
          date: '2024-01-27',
          time: '11:00 AM',
          duration: 30,
          type: 'emergency',
          status: 'cancelled',
          department: 'Emergency',
        },
      ];

      setAppointments(mockAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'consultation': return <PersonIcon />;
      case 'follow-up': return <ScheduleIcon />;
      case 'check-up': return <CalendarIcon />;
      case 'emergency': return <PersonIcon />;
      default: return <CalendarIcon />;
    }
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + direction);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction * 7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
      default:
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDateRangeText = () => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    
    switch (viewMode) {
      case 'day':
        return currentDate.toLocaleDateString('en-US', options);
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', options)}`;
      case 'month':
        return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      default:
        return '';
    }
  };

  const getAppointmentsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateStr);
  };

  const getAppointmentsForCurrentView = () => {
    switch (viewMode) {
      case 'day':
        return getAppointmentsForDate(currentDate);
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekAppointments = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          weekAppointments.push(...getAppointmentsForDate(date));
        }
        return weekAppointments;
      case 'month':
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        return appointments.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= monthStart && aptDate <= monthEnd;
        });
      default:
        return appointments;
    }
  };

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  const renderCalendarGrid = () => {
    if (viewMode === 'month') {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const startDate = new Date(monthStart);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      
      const days = [];
      const currentDateForLoop = new Date(startDate);
      
      // Generate 42 days (6 weeks)
      for (let i = 0; i < 42; i++) {
        const dayAppointments = getAppointmentsForDate(currentDateForLoop);
        const isCurrentMonth = currentDateForLoop.getMonth() === currentDate.getMonth();
        const isToday = currentDateForLoop.toDateString() === new Date().toDateString();
        
        days.push(
          <Grid item xs={12/7} key={i}>
            <Paper
              sx={{
                minHeight: 120,
                p: 1,
                bgcolor: isCurrentMonth ? 'background.paper' : 'grey.50',
                border: isToday ? 2 : 1,
                borderColor: isToday ? 'primary.main' : 'divider',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedDate(new Date(currentDateForLoop))}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isToday ? 'bold' : 'normal',
                  color: isCurrentMonth ? 'text.primary' : 'text.secondary',
                }}
              >
                {currentDateForLoop.getDate()}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {dayAppointments.slice(0, 3).map((apt, index) => (
                  <Chip
                    key={apt.id}
                    label={`${apt.time} - ${apt.patient}`}
                    size="small"
                    color={getStatusColor(apt.status)}
                    sx={{ 
                      fontSize: '0.6rem', 
                      height: 16, 
                      mb: 0.25,
                      display: 'block',
                      '& .MuiChip-label': { px: 0.5 }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAppointmentClick(apt);
                    }}
                  />
                ))}
                {dayAppointments.length > 3 && (
                  <Typography variant="caption" color="text.secondary">
                    +{dayAppointments.length - 3} more
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        );
        
        currentDateForLoop.setDate(currentDateForLoop.getDate() + 1);
      }
      
      return (
        <Grid container spacing={1}>
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Grid item xs={12/7} key={day}>
              <Typography variant="body2" align="center" sx={{ py: 1, fontWeight: 'bold' }}>
                {day}
              </Typography>
            </Grid>
          ))}
          {days}
        </Grid>
      );
    }
    
    return null;
  };

  const renderAppointmentsList = () => {
    const viewAppointments = getAppointmentsForCurrentView();
    
    if (viewAppointments.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No appointments found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {viewMode === 'day' ? 'No appointments for this day' : 
             viewMode === 'week' ? 'No appointments for this week' : 
             'No appointments for this month'}
          </Typography>
        </Box>
      );
    }

    return (
      <List>
        {viewAppointments.map((appointment, index) => (
          <React.Fragment key={appointment.id}>
            <ListItem
              button
              onClick={() => handleAppointmentClick(appointment)}
              sx={{ borderRadius: 1, mb: 1 }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: getStatusColor(appointment.status) + '.main' }}>
                  {getTypeIcon(appointment.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">
                      {appointment.patient}
                    </Typography>
                    <Chip
                      label={appointment.status}
                      size="small"
                      color={getStatusColor(appointment.status)}
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {appointment.date} at {appointment.time} • {appointment.duration} min
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {appointment.doctor} • {appointment.department}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            {index < viewAppointments.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    );
  };

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Appointment Calendar
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage appointments
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            href="/appointments/book"
          >
            Book Appointment
          </Button>
        </Box>

        {/* Calendar Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              {/* Navigation */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={() => navigateDate(-1)}>
                  <ChevronLeftIcon />
                </IconButton>
                <Button
                  variant="outlined"
                  onClick={goToToday}
                  startIcon={<TodayIcon />}
                  sx={{ minWidth: 100 }}
                >
                  Today
                </Button>
                <IconButton onClick={() => navigateDate(1)}>
                  <ChevronRightIcon />
                </IconButton>
                <Typography variant="h6" sx={{ ml: 2, minWidth: 200 }}>
                  {getDateRangeText()}
                </Typography>
              </Box>

              {/* View Mode Selector */}
              <ButtonGroup variant="outlined">
                <Button
                  variant={viewMode === 'day' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('day')}
                  startIcon={<ViewDayIcon />}
                >
                  Day
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('week')}
                  startIcon={<ViewWeekIcon />}
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === 'month' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('month')}
                  startIcon={<ViewModuleIcon />}
                >
                  Month
                </Button>
              </ButtonGroup>
            </Box>
          </CardContent>
        </Card>

        {/* Calendar Content */}
        <Grid container spacing={3}>
          {/* Calendar View */}
          <Grid item xs={12} md={viewMode === 'month' ? 12 : 8}>
            <Card>
              <CardContent>
                {viewMode === 'month' ? renderCalendarGrid() : renderAppointmentsList()}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar for Day/Week views */}
          {viewMode !== 'month' && (
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Appointment Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2">Total:</Typography>
                    <Badge badgeContent={getAppointmentsForCurrentView().length} color="primary">
                      <CalendarIcon />
                    </Badge>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Confirmed:</Typography>
                    <Typography variant="body2" color="success.main">
                      {getAppointmentsForCurrentView().filter(apt => apt.status === 'confirmed').length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Pending:</Typography>
                    <Typography variant="body2" color="warning.main">
                      {getAppointmentsForCurrentView().filter(apt => apt.status === 'pending').length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Completed:</Typography>
                    <Typography variant="body2" color="info.main">
                      {getAppointmentsForCurrentView().filter(apt => apt.status === 'completed').length}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Appointment Details Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Appointment Details
          </DialogTitle>
          <DialogContent>
            {selectedAppointment && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Patient</Typography>
                  <Typography variant="body1">{selectedAppointment.patient}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Doctor</Typography>
                  <Typography variant="body1">{selectedAppointment.doctor}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Date & Time</Typography>
                  <Typography variant="body1">
                    {selectedAppointment.date} at {selectedAppointment.time}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Duration</Typography>
                  <Typography variant="body1">{selectedAppointment.duration} minutes</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {selectedAppointment.type}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedAppointment.status}
                    size="small"
                    color={getStatusColor(selectedAppointment.status)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Department</Typography>
                  <Typography variant="body1">{selectedAppointment.department}</Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
            <Button variant="contained">Edit Appointment</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default AppointmentCalendar;
