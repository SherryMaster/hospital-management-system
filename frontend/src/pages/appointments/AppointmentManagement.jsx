/**
 * AppointmentManagement Component
 * 
 * Interfaces for appointment status updates, rescheduling, and cancellation
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  Divider,
  Alert,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/api';

const AppointmentManagement = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'reschedule', 'cancel', 'update'
  const [rescheduleData, setRescheduleData] = useState({
    date: null,
    timeSlot: '',
    reason: '',
  });

  const tabLabels = ['All Appointments', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, statusFilter, activeTab]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      // Fetch real appointments from API
      const result = await appointmentService.getAppointments({ page_size: 100 });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch appointments');
      }

      // Process appointments data
      const processedAppointments = (result.data?.results || []).map(appointment => ({
        id: appointment.id,
        patient: appointment.patient?.user?.full_name || appointment.patient?.full_name || 'Unknown Patient',
        patientEmail: appointment.patient?.user?.email || appointment.patient?.email || 'No email',
        doctor: appointment.doctor?.user?.full_name || appointment.doctor?.full_name || 'Unknown Doctor',
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        duration: appointment.duration || 30,
        type: appointment.appointment_type || 'consultation',
        status: appointment.status || 'pending',
        department: appointment.department?.name || appointment.doctor?.department?.name || 'Unknown Department',
        chiefComplaint: appointment.chief_complaint || 'No complaint specified',
        notes: appointment.notes || 'No notes'
      }));

      setAppointments(processedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    // Filter by tab (status)
    if (activeTab > 0) {
      const statusMap = ['', 'pending', 'confirmed', 'completed', 'cancelled'];
      filtered = filtered.filter(apt => apt.status === statusMap[activeTab]);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status (if using dropdown filter)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    setFilteredAppointments(filtered);
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

  const handleActionMenuOpen = (event, appointment) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedAppointment(appointment);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedAppointment(null);
  };

  const handleDialogOpen = (type) => {
    setDialogType(type);
    setDialogOpen(true);
    handleActionMenuClose();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogType('');
    setRescheduleData({ date: null, timeSlot: '', reason: '' });
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      // Update appointment status via API
      const result = await appointmentService.updateAppointment(appointmentId, { status: newStatus });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to update appointment status');
      }

      // Update local state
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );

      handleActionMenuClose();
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const handleReschedule = async () => {
    try {
      // Reschedule appointment via API
      const updateData = {
        appointment_date: rescheduleData.date ? rescheduleData.date.format('YYYY-MM-DD') : '',
        appointment_time: rescheduleData.timeSlot,
        status: 'pending', // Reset to pending after reschedule
        notes: rescheduleData.reason ? `Rescheduled: ${rescheduleData.reason}` : undefined
      };

      const result = await appointmentService.updateAppointment(selectedAppointment.id, updateData);

      if (result.error) {
        throw new Error(result.error.message || 'Failed to reschedule appointment');
      }

      // Update local state
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === selectedAppointment.id
            ? {
                ...apt,
                date: rescheduleData.date ? rescheduleData.date.format('YYYY-MM-DD') : '',
                time: rescheduleData.timeSlot,
                status: 'pending',
              }
            : apt
        )
      );

      handleDialogClose();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
    }
  };

  const handleCancel = async () => {
    try {
      // Cancel appointment via API
      const updateData = {
        status: 'cancelled',
        notes: rescheduleData.reason ? `Cancelled: ${rescheduleData.reason}` : 'Cancelled'
      };

      const result = await appointmentService.updateAppointment(selectedAppointment.id, updateData);

      if (result.error) {
        throw new Error(result.error.message || 'Failed to cancel appointment');
      }

      // Update local state
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === selectedAppointment.id
            ? { ...apt, status: 'cancelled' }
            : apt
        )
      );

      handleDialogClose();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const renderActionMenu = () => (
    <Menu
      anchorEl={actionMenuAnchor}
      open={Boolean(actionMenuAnchor)}
      onClose={handleActionMenuClose}
    >
      {selectedAppointment?.status === 'pending' && (
        <MenuItem onClick={() => handleStatusUpdate(selectedAppointment.id, 'confirmed')}>
          <CheckCircleIcon sx={{ mr: 1 }} />
          Confirm Appointment
        </MenuItem>
      )}
      {(selectedAppointment?.status === 'pending' || selectedAppointment?.status === 'confirmed') && (
        <MenuItem onClick={() => handleDialogOpen('reschedule')}>
          <EditIcon sx={{ mr: 1 }} />
          Reschedule
        </MenuItem>
      )}
      {selectedAppointment?.status === 'confirmed' && (
        <MenuItem onClick={() => handleStatusUpdate(selectedAppointment.id, 'completed')}>
          <CheckCircleIcon sx={{ mr: 1 }} />
          Mark as Completed
        </MenuItem>
      )}
      {(selectedAppointment?.status === 'pending' || selectedAppointment?.status === 'confirmed') && (
        <MenuItem onClick={() => handleDialogOpen('cancel')}>
          <CancelIcon sx={{ mr: 1 }} />
          Cancel Appointment
        </MenuItem>
      )}
    </Menu>
  );

  const renderRescheduleDialog = () => (
    <Dialog open={dialogOpen && dialogType === 'reschedule'} onClose={handleDialogClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reschedule Appointment</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current: {selectedAppointment?.date} at {selectedAppointment?.time}
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <DatePicker
                label="New Date"
                value={rescheduleData.date}
                onChange={(date) => setRescheduleData(prev => ({ ...prev, date }))}
                minDate={dayjs()}
                slotProps={{
                  textField: { fullWidth: true }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>New Time Slot</InputLabel>
                <Select
                  value={rescheduleData.timeSlot}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, timeSlot: e.target.value }))}
                  label="New Time Slot"
                >
                  <MenuItem value="09:00 AM">09:00 AM</MenuItem>
                  <MenuItem value="10:00 AM">10:00 AM</MenuItem>
                  <MenuItem value="11:00 AM">11:00 AM</MenuItem>
                  <MenuItem value="02:00 PM">02:00 PM</MenuItem>
                  <MenuItem value="03:00 PM">03:00 PM</MenuItem>
                  <MenuItem value="04:00 PM">04:00 PM</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Rescheduling"
                multiline
                rows={3}
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleReschedule}
          disabled={!rescheduleData.date || !rescheduleData.timeSlot}
        >
          Reschedule
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderCancelDialog = () => (
    <Dialog open={dialogOpen && dialogType === 'cancel'} onClose={handleDialogClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cancel Appointment</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Are you sure you want to cancel this appointment? This action cannot be undone.
        </Alert>
        <Typography variant="body2" gutterBottom>
          Appointment: {selectedAppointment?.patient} with {selectedAppointment?.doctor}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {selectedAppointment?.date} at {selectedAppointment?.time}
        </Typography>
        
        <TextField
          fullWidth
          label="Reason for Cancellation"
          multiline
          rows={3}
          value={rescheduleData.reason}
          onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
          sx={{ mt: 2 }}
          required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose}>Keep Appointment</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleCancel}
          disabled={!rescheduleData.reason.trim()}
        >
          Cancel Appointment
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Appointment Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage appointment status, reschedule, and cancellations
          </Typography>
        </Box>

        {/* Filters and Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search by patient, doctor, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Filter by Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Filter by Status"
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={loadAppointments}
                >
                  Refresh
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabLabels.map((label, index) => (
              <Tab key={index} label={label} />
            ))}
          </Tabs>
        </Paper>

        {/* Appointments List */}
        <Card>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredAppointments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No appointments found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search or filter criteria
                </Typography>
              </Box>
            ) : (
              <List>
                {filteredAppointments.map((appointment, index) => (
                  <React.Fragment key={appointment.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getStatusColor(appointment.status) + '.main' }}>
                          {getTypeIcon(appointment.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body1">
                              {appointment.patient}
                            </Typography>
                            <Chip
                              label={appointment.status}
                              size="small"
                              color={getStatusColor(appointment.status)}
                              variant="outlined"
                            />
                            <Chip
                              label={appointment.type}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                              {appointment.date} at {appointment.time} • {appointment.duration} min
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                              {appointment.doctor} • {appointment.department}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                              {appointment.chiefComplaint}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={(e) => handleActionMenuOpen(e, appointment)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredAppointments.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Action Menu */}
        {renderActionMenu()}

        {/* Dialogs */}
        {renderRescheduleDialog()}
        {renderCancelDialog()}
      </Box>
    </MainLayout>
  );
};

export default AppointmentManagement;
