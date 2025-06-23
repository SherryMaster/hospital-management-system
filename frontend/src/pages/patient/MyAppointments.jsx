/**
 * MyAppointments Page
 * 
 * Patient's personal appointments page with filtering, sorting, and management capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Avatar,
  Tooltip,
  TablePagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  MedicalServices as DoctorIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { appointmentService } from '../../services/api';

const MyAppointments = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, statusFilter, dateFilter, typeFilter]);

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await appointmentService.getMyAppointments({ page_size: 100 });
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch appointments');
      }
      
      const processedAppointments = (result.data?.results || result.data || []).map(appointment => ({
        id: appointment.id,
        appointmentId: appointment.appointment_id,
        doctorName: appointment.doctor_name,
        departmentName: appointment.department_name,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        duration: appointment.duration_display,
        type: appointment.appointment_type,
        status: appointment.status,
        priority: appointment.priority,
        chiefComplaint: appointment.chief_complaint,
        symptoms: appointment.symptoms,
        notes: appointment.notes,
        createdAt: appointment.created_at,
        canBeCancelled: appointment.can_be_cancelled,
        canBeRescheduled: appointment.can_be_rescheduled,
      }));
      
      setAppointments(processedAppointments);
    } catch (err) {
      setError(err.message);
      showNotification('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.chiefComplaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.appointmentId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }
    
    // Date filter
    if (dateFilter) {
      const today = new Date();
      const filterDate = new Date(today);
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(appointment => {
            const appointmentDate = new Date(appointment.date);
            appointmentDate.setHours(0, 0, 0, 0);
            return appointmentDate.getTime() === filterDate.getTime();
          });
          break;
        case 'upcoming':
          filtered = filtered.filter(appointment => new Date(appointment.date) >= today);
          break;
        case 'past':
          filtered = filtered.filter(appointment => new Date(appointment.date) < today);
          break;
        default:
          break;
      }
    }
    
    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(appointment => appointment.type === typeFilter);
    }
    
    setFilteredAppointments(filtered);
  };

  const handleCancelClick = (appointment) => {
    setAppointmentToCancel(appointment);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!appointmentToCancel || !cancelReason.trim()) {
      showNotification('Please provide a cancellation reason', 'warning');
      return;
    }
    
    try {
      const result = await appointmentService.cancelAppointment(appointmentToCancel.id, cancelReason);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to cancel appointment');
      }
      
      showNotification('Appointment cancelled successfully', 'success');
      setCancelDialogOpen(false);
      setAppointmentToCancel(null);
      setCancelReason('');
      loadAppointments();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'error';
      case 'rescheduled':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case 'emergency':
        return 'error';
      case 'high':
        return 'warning';
      case 'normal':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedAppointments = filteredAppointments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading && appointments.length === 0) {
    return (
      <MainLayout user={user} onLogout={logout}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              My Appointments
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage your medical appointments
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAppointments}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Appointments
                </Typography>
                <Typography variant="h4">
                  {appointments.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Upcoming
                </Typography>
                <Typography variant="h4">
                  {appointments.filter(apt => 
                    new Date(apt.date) >= new Date() && 
                    ['confirmed', 'pending'].includes(apt.status)
                  ).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h4">
                  {appointments.filter(apt => apt.status === 'completed').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Cancelled
                </Typography>
                <Typography variant="h4">
                  {appointments.filter(apt => apt.status === 'cancelled').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="rescheduled">Rescheduled</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <MenuItem value="">All Dates</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="past">Past</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="consultation">Consultation</MenuItem>
                  <MenuItem value="follow_up">Follow-up</MenuItem>
                  <MenuItem value="checkup">Checkup</MenuItem>
                  <MenuItem value="procedure">Procedure</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setDateFilter('');
                    setTypeFilter('');
                  }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Appointments Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Appointment ID</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        {loading ? 'Loading appointments...' : 'No appointments found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAppointments.map((appointment) => (
                    <TableRow key={appointment.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {appointment.appointmentId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            <DoctorIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2">
                            {appointment.doctorName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {appointment.departmentName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {formatDate(appointment.date)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(appointment.time)} ({appointment.duration})
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {appointment.type?.replace('_', ' ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={appointment.status}
                          color={getStatusColor(appointment.status)}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={appointment.priority}
                          color={getPriorityColor(appointment.priority)}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {appointment.canBeRescheduled && (
                            <Tooltip title="Reschedule">
                              <IconButton size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {appointment.canBeCancelled && (
                            <Tooltip title="Cancel">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCancelClick(appointment)}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredAppointments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>

        {/* Cancel Appointment Dialog */}
        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Cancel Appointment</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to cancel this appointment?
            </Typography>
            {appointmentToCancel && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2">Appointment Details:</Typography>
                <Typography variant="body2">
                  <strong>Doctor:</strong> {appointmentToCancel.doctorName}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {formatDate(appointmentToCancel.date)} at {formatTime(appointmentToCancel.time)}
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> {appointmentToCancel.type?.replace('_', ' ')}
                </Typography>
              </Box>
            )}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Cancellation Reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancellation..."
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>
              Keep Appointment
            </Button>
            <Button
              onClick={handleCancelConfirm}
              color="error"
              variant="contained"
              disabled={!cancelReason.trim()}
            >
              Cancel Appointment
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default MyAppointments;
