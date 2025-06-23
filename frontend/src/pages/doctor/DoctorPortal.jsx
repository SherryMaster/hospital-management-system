/**
 * DoctorPortal Component
 * 
 * Doctor portal with patient records access, schedule management, and availability settings
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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  MedicalServices as MedicalIcon,
  Assignment as AssignmentIcon,
  AccessTime as TimeIcon,
  Phone as PhoneIcon,
  VideoCall as VideoCallIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { doctorService, appointmentService, patientService } from '../../services/api';

const DoctorPortal = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [doctorData, setDoctorData] = useState({
    patients: [],
    schedule: [],
    availability: {
      monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      saturday: { enabled: false, startTime: '09:00', endTime: '13:00' },
      sunday: { enabled: false, startTime: '09:00', endTime: '13:00' },
    },
    profile: {
      name: '',
      specialization: '',
      experience: '',
      education: '',
      certifications: [],
      consultationFee: 0,
    },
  });

  const tabLabels = ['My Patients', 'Schedule', 'Availability', 'Profile'];

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch doctor profile, patients, and appointments in parallel
      const [profileResult, patientsResult, appointmentsResult] = await Promise.all([
        doctorService.getMyProfile(),
        patientService.getPatients({ doctor: user?.id, page_size: 50 }),
        appointmentService.getAppointments({ doctor: user?.id, page_size: 50 })
      ]);

      // Process profile data
      let profileData = {
        name: '',
        specialization: '',
        experience: '',
        education: '',
        certifications: [],
        consultationFee: 0,
      };

      if (profileResult.data) {
        const profile = profileResult.data;
        profileData = {
          name: `Dr. ${profile.user?.full_name || `${profile.user?.first_name} ${profile.user?.last_name}`.trim()}`,
          specialization: profile.specializations?.[0]?.name || profile.department?.name || 'General Medicine',
          experience: profile.years_of_experience ? `${profile.years_of_experience} years` : 'Not specified',
          education: profile.education || 'Not specified',
          certifications: profile.certifications ? profile.certifications.split(',').map(c => c.trim()).filter(c => c) : [],
          consultationFee: parseFloat(profile.consultation_fee || 0),
        };
      }

      // Process patients data
      const patients = (patientsResult.data?.results || []).map(patient => {
        // Calculate age from date of birth
        const age = patient.date_of_birth ?
          new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() :
          'Unknown';

        // Find the most recent appointment for this patient
        const patientAppointments = (appointmentsResult.data?.results || [])
          .filter(apt => apt.patient?.id === patient.id)
          .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

        const lastVisit = patientAppointments.find(apt => apt.status === 'completed')?.appointment_date;
        const nextAppointment = patientAppointments.find(apt =>
          apt.status === 'confirmed' || apt.status === 'scheduled'
        )?.appointment_date;

        return {
          id: patient.id,
          name: patient.user?.full_name || `${patient.user?.first_name} ${patient.user?.last_name}`.trim(),
          age: age,
          gender: patient.gender || 'Not specified',
          phone: patient.phone_number || patient.user?.phone || 'Not provided',
          email: patient.user?.email || 'Not provided',
          lastVisit: lastVisit || 'No previous visits',
          nextAppointment: nextAppointment || null,
          condition: patient.chronic_conditions || 'No conditions noted',
          status: patient.is_active ? 'active' : 'inactive',
          bloodType: patient.blood_type || 'Unknown',
          allergies: patient.allergies ? patient.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
          medicalHistory: [], // This would need a separate API call for detailed medical history
        };
      });

      // Process schedule/appointments data
      const schedule = (appointmentsResult.data?.results || []).map(apt => ({
        id: apt.id,
        date: apt.appointment_date,
        time: apt.appointment_time,
        patient: apt.patient?.user?.full_name || apt.patient?.full_name || 'Unknown Patient',
        type: apt.appointment_type || 'consultation',
        duration: 30, // Default duration, could be from appointment data
        status: apt.status,
      }));

      setDoctorData(prev => ({
        ...prev,
        patients,
        schedule,
        profile: profileData,
      }));

    } catch (error) {
      console.error('Error loading doctor data:', error);
      setError('Failed to load doctor data. Please try again.');
      showNotification('Failed to load doctor data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'recovered': return 'info';
      case 'critical': return 'error';
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const filteredPatients = doctorData.patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.condition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientDialogOpen(true);
  };

  const handleAvailabilityChange = (day, field, value) => {
    setDoctorData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value,
        },
      },
    }));
  };

  const renderPatientsTab = () => (
    <Box>
      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search patients by name or condition..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
        }}
        sx={{ mb: 3 }}
      />

      {/* Patients List */}
      <Grid container spacing={2}>
        {filteredPatients.map((patient) => (
          <Grid item xs={12} md={6} lg={4} key={patient.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{patient.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {patient.age} years • {patient.gender}
                    </Typography>
                  </Box>
                  <Chip
                    label={patient.status}
                    color={getStatusColor(patient.status)}
                    size="small"
                  />
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Condition
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {patient.condition}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Visit
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {patient.lastVisit}
                </Typography>
                
                {patient.nextAppointment && (
                  <>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Next Appointment
                    </Typography>
                    <Typography variant="body1" color="primary.main">
                      {patient.nextAppointment}
                    </Typography>
                  </>
                )}
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handleViewPatient(patient)}>
                  View Details
                </Button>
                <IconButton size="small" color="primary">
                  <PhoneIcon />
                </IconButton>
                <IconButton size="small" color="primary">
                  <EmailIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderScheduleTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Today's Schedule</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Appointment
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {doctorData.schedule.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell>
                  <Typography variant="body2">{appointment.date}</Typography>
                  <Typography variant="caption" color="text.secondary">{appointment.time}</Typography>
                </TableCell>
                <TableCell>{appointment.patient}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{appointment.type}</TableCell>
                <TableCell>{appointment.duration} min</TableCell>
                <TableCell>
                  <Chip
                    label={appointment.status}
                    color={getStatusColor(appointment.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <PhoneIcon />
                  </IconButton>
                  <IconButton size="small" color="primary">
                    <VideoCallIcon />
                  </IconButton>
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderAvailabilityTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Weekly Availability</Typography>
        <Button variant="contained" onClick={() => setAvailabilityDialogOpen(true)}>
          Update Availability
        </Button>
      </Box>

      <Grid container spacing={2}>
        {Object.entries(doctorData.availability).map(([day, settings]) => (
          <Grid item xs={12} sm={6} md={4} key={day}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {day}
                  </Typography>
                  <Chip
                    label={settings.enabled ? 'Available' : 'Unavailable'}
                    color={settings.enabled ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                {settings.enabled && (
                  <Typography variant="body2" color="text.secondary">
                    {settings.startTime} - {settings.endTime}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderProfileTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{doctorData.profile.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {doctorData.profile.specialization}
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Experience</Typography>
                <Typography variant="body1">{doctorData.profile.experience}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Education</Typography>
                <Typography variant="body1">{doctorData.profile.education}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Consultation Fee</Typography>
                <Typography variant="body1">${doctorData.profile.consultationFee}</Typography>
              </Grid>
            </Grid>
          </CardContent>
          <CardActions>
            <Button size="small" startIcon={<EditIcon />}>
              Edit Profile
            </Button>
          </CardActions>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Certifications</Typography>
            <List>
              {doctorData.profile.certifications.map((cert, index) => (
                <ListItem key={index}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <AssignmentIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={cert} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <MainLayout user={user} onLogout={logout}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Loading your practice information...
            </Typography>
          </Box>
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
            Doctor Portal
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your patients, schedule, and availability
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
            <Button size="small" onClick={loadDoctorData} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        )}

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

        {/* Tab Content */}
        <Box>
          {activeTab === 0 && renderPatientsTab()}
          {activeTab === 1 && renderScheduleTab()}
          {activeTab === 2 && renderAvailabilityTab()}
          {activeTab === 3 && renderProfileTab()}
        </Box>

        {/* Patient Details Dialog */}
        <Dialog open={patientDialogOpen} onClose={() => setPatientDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Patient Details - {selectedPatient?.name}
          </DialogTitle>
          <DialogContent>
            {selectedPatient && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Personal Information</Typography>
                  <Typography variant="body2" color="text.secondary">Age: {selectedPatient.age}</Typography>
                  <Typography variant="body2" color="text.secondary">Gender: {selectedPatient.gender}</Typography>
                  <Typography variant="body2" color="text.secondary">Phone: {selectedPatient.phone}</Typography>
                  <Typography variant="body2" color="text.secondary">Email: {selectedPatient.email}</Typography>
                  <Typography variant="body2" color="text.secondary">Blood Type: {selectedPatient.bloodType}</Typography>
                  
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Allergies</Typography>
                  {selectedPatient.allergies.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selectedPatient.allergies.map((allergy, index) => (
                        <Chip key={index} label={allergy} color="warning" size="small" />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No known allergies</Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Medical History</Typography>
                  {selectedPatient.medicalHistory.map((record, index) => (
                    <Accordion key={index} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body2">{record.date} - {record.diagnosis}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" gutterBottom><strong>Treatment:</strong> {record.treatment}</Typography>
                        <Typography variant="body2"><strong>Notes:</strong> {record.notes}</Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPatientDialogOpen(false)}>Close</Button>
            <Button variant="contained">Add Note</Button>
          </DialogActions>
        </Dialog>

        {/* Availability Settings Dialog */}
        <Dialog open={availabilityDialogOpen} onClose={() => setAvailabilityDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Update Availability</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {Object.entries(doctorData.availability).map(([day, settings]) => (
                <Grid item xs={12} key={day}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.enabled}
                          onChange={(e) => handleAvailabilityChange(day, 'enabled', e.target.checked)}
                        />
                      }
                      label={day.charAt(0).toUpperCase() + day.slice(1)}
                      sx={{ minWidth: 120 }}
                    />
                    {settings.enabled && (
                      <>
                        <TextField
                          type="time"
                          label="Start Time"
                          value={settings.startTime}
                          onChange={(e) => handleAvailabilityChange(day, 'startTime', e.target.value)}
                          size="small"
                        />
                        <TextField
                          type="time"
                          label="End Time"
                          value={settings.endTime}
                          onChange={(e) => handleAvailabilityChange(day, 'endTime', e.target.value)}
                          size="small"
                        />
                      </>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAvailabilityDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Save Changes</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default DoctorPortal;
