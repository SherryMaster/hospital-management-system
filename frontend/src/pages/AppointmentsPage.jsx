/**
 * AppointmentsPage Component
 * 
 * Page for managing appointments in the hospital system
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  MedicalServices as DoctorIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { MainLayout } from '../components/layout';
import { useAuth } from '../contexts/AuthContext';
import { useAppointments, useDoctors, usePatients } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';

const AppointmentsPage = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const {
    appointments,
    pagination,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    cancelAppointment,
  } = useAppointments();

  const { doctors, fetchDoctors } = useDoctors();
  const { patients, fetchPatients } = usePatients();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [appointmentToEdit, setAppointmentToEdit] = useState(null);
  const [appointmentToView, setAppointmentToView] = useState(null);
  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'consultation',
    chief_complaint: '',
    notes: '',
  });

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAppointments();
      fetchDoctors();
      fetchPatients();


    }
  }, [isAuthenticated]);

  const loadAppointments = () => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (statusFilter) params.status = statusFilter;
    if (doctorFilter) params.doctor = doctorFilter;
    if (dateFilter) params.date = dateFilter;
    console.log('Loading appointments with params:', params);
    fetchAppointments(params);
  };

  const handleSearch = () => {
    loadAppointments();
  };

  const handleCreateClick = () => {
    setFormData({
      patient: '',
      doctor: '',
      appointment_date: '',
      appointment_time: '',
      appointment_type: 'consultation',
      chief_complaint: '',
      notes: '',
    });
    setCreateDialogOpen(true);
  };

  const handleEditClick = (appointment) => {
    setAppointmentToEdit(appointment);
    setFormData({
      patient: appointment.patient?.id || '',
      doctor: appointment.doctor?.id || '',
      appointment_date: appointment.appointment_date || '',
      appointment_time: appointment.appointment_time || '',
      appointment_type: appointment.appointment_type || 'consultation',
      chief_complaint: appointment.chief_complaint || '',
      notes: appointment.notes || '',
    });
    setEditDialogOpen(true);
  };

  const handleViewClick = (appointment) => {
    setAppointmentToView(appointment);
    setDetailsDialogOpen(true);
  };

  const handleCancelClick = (appointment) => {
    setAppointmentToCancel(appointment);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (appointmentToCancel) {
      const result = await cancelAppointment(appointmentToCancel.id, 'Cancelled by staff');
      if (result.data) {
        loadAppointments();
      }
    }
    setCancelDialogOpen(false);
    setAppointmentToCancel(null);
  };

  const handleFormSubmit = async () => {
    try {
      if (appointmentToEdit) {
        // Update existing appointment
        console.log('Updating appointment with data:', formData);
        const result = await updateAppointment(appointmentToEdit.id, formData);
        if (result.data) {
          loadAppointments();
          setEditDialogOpen(false);
          setAppointmentToEdit(null);
        } else if (result.error) {
          console.error('Update error:', result.error);
        }
      } else {
        // Create new appointment
        console.log('Creating appointment with data:', formData);
        const result = await createAppointment(formData);
        if (result.data) {
          loadAppointments();
          setCreateDialogOpen(false);
        } else if (result.error) {
          console.error('Create error:', result.error);
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'confirmed': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'no_show': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography>Loading...</Typography>
        </Box>
      </MainLayout>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Appointment Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage patient appointments and schedules
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadAppointments}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
            >
              Book Appointment
            </Button>
          </Box>
        </Box>

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
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="no_show">No Show</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Doctor"
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(e.target.value)}
                >
                  <MenuItem value="">All Doctors</MenuItem>
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.user?.full_name || doctor.user?.last_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button fullWidth variant="contained" onClick={handleSearch}>
                  Search
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>



        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Appointments Table */}
        <Card>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Doctor</TableCell>
                      <TableCell>Date & Time</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Complaint</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <PersonIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {appointment.patient?.full_name || 'Unknown Patient'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {appointment.patient?.patient_id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                              <DoctorIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                Dr. {appointment.doctor?.full_name || 'Unknown Doctor'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {appointment.department?.name}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(appointment.appointment_date)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(appointment.appointment_time)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={appointment.appointment_type || 'consultation'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={appointment.status}
                            size="small"
                            color={getStatusColor(appointment.status)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {appointment.chief_complaint || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleViewClick(appointment)}
                            title="View Details"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(appointment)}
                            title="Edit Appointment"
                          >
                            <EditIcon />
                          </IconButton>
                          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleCancelClick(appointment)}
                              title="Cancel Appointment"
                            >
                              <CancelIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Pagination info */}
            {pagination && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {appointments.length} of {pagination.count} appointments
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Create Appointment Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Book New Appointment</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Patient"
                    value={formData.patient}
                    onChange={(e) => handleFormChange('patient', e.target.value)}
                    required
                  >
                    {patients.map((patient) => (
                      <MenuItem key={patient.id} value={patient.id}>
                        {patient.user?.full_name} ({patient.patient_id})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Doctor"
                    value={formData.doctor}
                    onChange={(e) => handleFormChange('doctor', e.target.value)}
                    required
                  >
                    {doctors.map((doctor) => (
                      <MenuItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.user?.full_name} - {doctor.department_name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Appointment Date"
                    value={formData.appointment_date}
                    onChange={(e) => handleFormChange('appointment_date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Appointment Time"
                    value={formData.appointment_time}
                    onChange={(e) => handleFormChange('appointment_time', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Appointment Type"
                    value={formData.appointment_type}
                    onChange={(e) => handleFormChange('appointment_type', e.target.value)}
                    required
                  >
                    <MenuItem value="consultation">Consultation</MenuItem>
                    <MenuItem value="follow-up">Follow-up</MenuItem>
                    <MenuItem value="check-up">Check-up</MenuItem>
                    <MenuItem value="emergency">Emergency</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Chief Complaint"
                    value={formData.chief_complaint}
                    onChange={(e) => handleFormChange('chief_complaint', e.target.value)}
                    placeholder="Brief description of the issue"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Additional notes or instructions"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              variant="contained"
              disabled={loading}
            >
              Book Appointment
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Appointment Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setAppointmentToEdit(null);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Patient"
                    value={formData.patient}
                    onChange={(e) => handleFormChange('patient', e.target.value)}
                    required
                  >
                    {patients.map((patient) => (
                      <MenuItem key={patient.id} value={patient.id}>
                        {patient.user?.full_name} ({patient.patient_id})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Doctor"
                    value={formData.doctor}
                    onChange={(e) => handleFormChange('doctor', e.target.value)}
                    required
                  >
                    {doctors.map((doctor) => (
                      <MenuItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.user?.full_name} - {doctor.department_name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Appointment Date"
                    value={formData.appointment_date}
                    onChange={(e) => handleFormChange('appointment_date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Appointment Time"
                    value={formData.appointment_time}
                    onChange={(e) => handleFormChange('appointment_time', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Appointment Type"
                    value={formData.appointment_type}
                    onChange={(e) => handleFormChange('appointment_type', e.target.value)}
                    required
                  >
                    <MenuItem value="consultation">Consultation</MenuItem>
                    <MenuItem value="follow-up">Follow-up</MenuItem>
                    <MenuItem value="check-up">Check-up</MenuItem>
                    <MenuItem value="emergency">Emergency</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Chief Complaint"
                    value={formData.chief_complaint}
                    onChange={(e) => handleFormChange('chief_complaint', e.target.value)}
                    placeholder="Brief description of the issue"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Additional notes or instructions"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setEditDialogOpen(false);
              setAppointmentToEdit(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              variant="contained"
              disabled={loading}
            >
              Update Appointment
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cancel Appointment Dialog */}
        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
          <DialogTitle>Cancel Appointment</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to cancel the appointment for{' '}
              <strong>{appointmentToCancel?.patient?.full_name}</strong> with{' '}
              <strong>Dr. {appointmentToCancel?.doctor?.full_name}</strong> on{' '}
              <strong>{appointmentToCancel && formatDate(appointmentToCancel.appointment_date)}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>
              Keep Appointment
            </Button>
            <Button onClick={handleCancelConfirm} color="error" variant="contained">
              Cancel Appointment
            </Button>
          </DialogActions>
        </Dialog>

        {/* Appointment Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => {
            setDetailsDialogOpen(false);
            setAppointmentToView(null);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarIcon color="primary" />
              <Typography variant="h6">Appointment Details</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {appointmentToView && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={3}>
                  {/* Patient Information */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <PersonIcon />
                          </Avatar>
                          <Typography variant="h6">Patient Information</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body1">
                            <strong>Name:</strong> {appointmentToView.patient?.full_name || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Patient ID:</strong> {appointmentToView.patient?.patient_id || 'N/A'}
                          </Typography>
                          {appointmentToView.patient?.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2">{appointmentToView.patient.phone}</Typography>
                            </Box>
                          )}
                          {appointmentToView.patient?.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2">{appointmentToView.patient.email}</Typography>
                            </Box>
                          )}
                          {appointmentToView.patient?.address && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationIcon fontSize="small" color="action" />
                              <Typography variant="body2">{appointmentToView.patient.address}</Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Doctor Information */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            <DoctorIcon />
                          </Avatar>
                          <Typography variant="h6">Doctor Information</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body1">
                            <strong>Name:</strong> Dr. {appointmentToView.doctor?.full_name || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Department:</strong> {appointmentToView.department?.name || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Specialization:</strong> {appointmentToView.doctor?.specialization || 'N/A'}
                          </Typography>
                          {appointmentToView.doctor?.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2">{appointmentToView.doctor.phone}</Typography>
                            </Box>
                          )}
                          {appointmentToView.doctor?.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2">{appointmentToView.doctor.email}</Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Appointment Details */}
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <TimeIcon color="primary" />
                          <Typography variant="h6">Appointment Details</Typography>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" color="text.secondary">Date</Typography>
                            <Typography variant="body1">{formatDate(appointmentToView.appointment_date)}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" color="text.secondary">Time</Typography>
                            <Typography variant="body1">{formatTime(appointmentToView.appointment_time)}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" color="text.secondary">Type</Typography>
                            <Chip
                              label={appointmentToView.appointment_type || 'consultation'}
                              size="small"
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" color="text.secondary">Status</Typography>
                            <Chip
                              label={appointmentToView.status}
                              size="small"
                              color={getStatusColor(appointmentToView.status)}
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Appointment ID</Typography>
                            <Typography variant="body1">{appointmentToView.appointment_id || appointmentToView.id}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Created</Typography>
                            <Typography variant="body1">
                              {appointmentToView.created_at ? formatDate(appointmentToView.created_at) : 'N/A'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Medical Information */}
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Medical Information</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">Chief Complaint</Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                              {appointmentToView.chief_complaint || 'No complaint specified'}
                            </Typography>
                          </Grid>
                          {appointmentToView.notes && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">Notes</Typography>
                              <Typography variant="body1" sx={{ mt: 1 }}>
                                {appointmentToView.notes}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Cancellation Information */}
                  {appointmentToView.status === 'cancelled' && (
                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ borderColor: 'error.main' }}>
                        <CardContent>
                          <Typography variant="h6" color="error" gutterBottom>Cancellation Information</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">Cancelled At</Typography>
                              <Typography variant="body1">
                                {appointmentToView.cancelled_at ? formatDate(appointmentToView.cancelled_at) : 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">Cancelled By</Typography>
                              <Typography variant="body1">
                                {appointmentToView.cancelled_by?.full_name || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">Reason</Typography>
                              <Typography variant="body1">
                                {appointmentToView.cancellation_reason || 'No reason provided'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setDetailsDialogOpen(false);
              setAppointmentToView(null);
            }}>
              Close
            </Button>
            {appointmentToView && appointmentToView.status !== 'cancelled' && appointmentToView.status !== 'completed' && (
              <>
                <Button
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    handleEditClick(appointmentToView);
                  }}
                  variant="outlined"
                  startIcon={<EditIcon />}
                >
                  Edit
                </Button>
                <Button
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    handleCancelClick(appointmentToView);
                  }}
                  color="error"
                  variant="outlined"
                  startIcon={<CancelIcon />}
                >
                  Cancel
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default AppointmentsPage;
