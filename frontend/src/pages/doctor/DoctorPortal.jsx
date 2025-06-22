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
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';

const DoctorPortal = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [doctorData, setDoctorData] = useState({
    patients: [
      {
        id: 1,
        name: 'John Doe',
        age: 38,
        gender: 'Male',
        phone: '+1 (555) 123-4567',
        email: 'john.doe@example.com',
        lastVisit: '2024-01-15',
        nextAppointment: '2024-02-01',
        condition: 'Hypertension',
        status: 'active',
        bloodType: 'O+',
        allergies: ['Penicillin'],
        medicalHistory: [
          {
            date: '2024-01-15',
            diagnosis: 'Hypertension monitoring',
            treatment: 'Blood pressure medication adjustment',
            notes: 'Patient responding well to treatment.',
          },
          {
            date: '2024-01-10',
            diagnosis: 'Annual physical examination',
            treatment: 'Routine checkup and blood work',
            notes: 'Overall health is good.',
          },
        ],
      },
      {
        id: 2,
        name: 'Jane Smith',
        age: 45,
        gender: 'Female',
        phone: '+1 (555) 987-6543',
        email: 'jane.smith@example.com',
        lastVisit: '2024-01-12',
        nextAppointment: '2024-01-28',
        condition: 'Diabetes Type 2',
        status: 'active',
        bloodType: 'A+',
        allergies: ['Shellfish'],
        medicalHistory: [
          {
            date: '2024-01-12',
            diagnosis: 'Diabetes management',
            treatment: 'Insulin dosage adjustment',
            notes: 'Blood sugar levels improving.',
          },
        ],
      },
      {
        id: 3,
        name: 'Mike Johnson',
        age: 29,
        gender: 'Male',
        phone: '+1 (555) 456-7890',
        email: 'mike.johnson@example.com',
        lastVisit: '2024-01-08',
        nextAppointment: null,
        condition: 'Sports Injury',
        status: 'recovered',
        bloodType: 'B+',
        allergies: [],
        medicalHistory: [
          {
            date: '2024-01-08',
            diagnosis: 'Knee ligament strain',
            treatment: 'Physical therapy and rest',
            notes: 'Full recovery expected in 4-6 weeks.',
          },
        ],
      },
    ],
    schedule: [
      {
        id: 1,
        date: '2024-01-25',
        time: '09:00 AM',
        patient: 'John Doe',
        type: 'Follow-up',
        duration: 30,
        status: 'confirmed',
      },
      {
        id: 2,
        date: '2024-01-25',
        time: '10:30 AM',
        patient: 'Sarah Wilson',
        type: 'Consultation',
        duration: 45,
        status: 'confirmed',
      },
      {
        id: 3,
        date: '2024-01-26',
        time: '02:00 PM',
        patient: 'Mike Brown',
        type: 'Check-up',
        duration: 30,
        status: 'pending',
      },
    ],
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
      name: 'Dr. John Smith',
      specialization: 'Cardiology',
      experience: '15 years',
      education: 'MD from Harvard Medical School',
      certifications: ['Board Certified Cardiologist', 'ACLS Certified'],
      consultationFee: 200,
    },
  });

  const tabLabels = ['My Patients', 'Schedule', 'Availability', 'Profile'];

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      console.log('Loading doctor data...');
    } catch (error) {
      console.error('Error loading doctor data:', error);
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
