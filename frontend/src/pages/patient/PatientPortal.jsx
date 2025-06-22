/**
 * PatientPortal Component
 * 
 * Patient portal with medical records view, appointment history, and profile management
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
  Alert,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  LocalHospital as HospitalIcon,
  Medication as MedicationIcon,
  Assignment as AssignmentIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';

const PatientPortal = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [patientData, setPatientData] = useState({
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      dateOfBirth: '1985-06-15',
      gender: 'Male',
      address: '123 Main St, City, State 12345',
      emergencyContact: 'Jane Doe - +1 (555) 987-6543',
      bloodType: 'O+',
      allergies: ['Penicillin', 'Shellfish'],
      chronicConditions: ['Hypertension'],
    },
    medicalRecords: [
      {
        id: 1,
        date: '2024-01-15',
        doctor: 'Dr. Smith',
        department: 'Cardiology',
        diagnosis: 'Hypertension monitoring',
        treatment: 'Blood pressure medication adjustment',
        notes: 'Patient responding well to treatment. Continue current medication.',
        vitals: {
          bloodPressure: '130/85',
          heartRate: '72 bpm',
          temperature: '98.6°F',
          weight: '175 lbs',
        },
        prescriptions: [
          { medication: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
          { medication: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
        ],
      },
      {
        id: 2,
        date: '2024-01-10',
        doctor: 'Dr. Johnson',
        department: 'General Medicine',
        diagnosis: 'Annual physical examination',
        treatment: 'Routine checkup and blood work',
        notes: 'Overall health is good. Recommended lifestyle modifications.',
        vitals: {
          bloodPressure: '125/80',
          heartRate: '68 bpm',
          temperature: '98.4°F',
          weight: '173 lbs',
        },
        prescriptions: [],
      },
    ],
    appointments: [
      {
        id: 1,
        date: '2024-02-01',
        time: '10:00 AM',
        doctor: 'Dr. Smith',
        department: 'Cardiology',
        type: 'Follow-up',
        status: 'confirmed',
        notes: 'Blood pressure check',
      },
      {
        id: 2,
        date: '2024-01-15',
        time: '09:00 AM',
        doctor: 'Dr. Smith',
        department: 'Cardiology',
        type: 'Consultation',
        status: 'completed',
        notes: 'Hypertension monitoring',
      },
      {
        id: 3,
        date: '2024-01-10',
        time: '11:30 AM',
        doctor: 'Dr. Johnson',
        department: 'General Medicine',
        type: 'Check-up',
        status: 'completed',
        notes: 'Annual physical examination',
      },
    ],
    invoices: [
      {
        id: 1,
        date: '2024-01-15',
        amount: 250.00,
        description: 'Cardiology consultation',
        status: 'paid',
        doctor: 'Dr. Smith',
      },
      {
        id: 2,
        date: '2024-01-10',
        amount: 180.00,
        description: 'Annual physical examination',
        status: 'paid',
        doctor: 'Dr. Johnson',
      },
      {
        id: 3,
        date: '2024-02-01',
        amount: 200.00,
        description: 'Follow-up consultation',
        status: 'pending',
        doctor: 'Dr. Smith',
      },
    ],
  });

  const tabLabels = ['Profile', 'Medical Records', 'Appointments', 'Billing'];

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // Data is already set in state for demo
      console.log('Loading patient data...');
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      case 'paid': return 'success';
      default: return 'default';
    }
  };

  const handleEditProfile = () => {
    setEditDialogOpen(true);
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
  };

  const renderProfileTab = () => (
    <Grid container spacing={3}>
      {/* Personal Information */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Personal Information</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">First Name</Typography>
                <Typography variant="body1">{patientData.profile.firstName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Last Name</Typography>
                <Typography variant="body1">{patientData.profile.lastName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                <Typography variant="body1">{patientData.profile.dateOfBirth}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Gender</Typography>
                <Typography variant="body1">{patientData.profile.gender}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Blood Type</Typography>
                <Chip label={patientData.profile.bloodType} color="error" size="small" />
              </Grid>
            </Grid>
          </CardContent>
          <CardActions>
            <Button size="small" startIcon={<EditIcon />} onClick={handleEditProfile}>
              Edit Profile
            </Button>
          </CardActions>
        </Card>
      </Grid>

      {/* Contact Information */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Contact Information</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">{patientData.profile.email}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">{patientData.profile.phone}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">{patientData.profile.address}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Emergency Contact</Typography>
                <Typography variant="body1">{patientData.profile.emergencyContact}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Medical Information */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MedicalIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Medical Information</Typography>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Allergies</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {patientData.profile.allergies.map((allergy, index) => (
                    <Chip key={index} label={allergy} color="warning" size="small" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Chronic Conditions</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {patientData.profile.chronicConditions.map((condition, index) => (
                    <Chip key={index} label={condition} color="info" size="small" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Blood Type</Typography>
                <Chip label={patientData.profile.bloodType} color="error" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderMedicalRecordsTab = () => (
    <Box>
      {patientData.medicalRecords.map((record) => (
        <Accordion key={record.id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <AssignmentIcon />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{record.diagnosis}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {record.date} • {record.doctor} • {record.department}
                </Typography>
              </Box>
              <IconButton onClick={() => handleViewRecord(record)}>
                <VisibilityIcon />
              </IconButton>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Treatment</Typography>
                <Typography variant="body1" paragraph>{record.treatment}</Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>Notes</Typography>
                <Typography variant="body1" paragraph>{record.notes}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Vitals</Typography>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption">Blood Pressure</Typography>
                      <Typography variant="body2">{record.vitals.bloodPressure}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption">Heart Rate</Typography>
                      <Typography variant="body2">{record.vitals.heartRate}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption">Temperature</Typography>
                      <Typography variant="body2">{record.vitals.temperature}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption">Weight</Typography>
                      <Typography variant="body2">{record.vitals.weight}</Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {record.prescriptions.length > 0 && (
                  <>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Prescriptions</Typography>
                    <List dense>
                      {record.prescriptions.map((prescription, index) => (
                        <ListItem key={index}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                              <MedicationIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={prescription.medication}
                            secondary={`${prescription.dosage} - ${prescription.frequency}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button size="small" startIcon={<DownloadIcon />}>
                Download Report
              </Button>
              <Button size="small" startIcon={<VisibilityIcon />}>
                View Details
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );

  const renderAppointmentsTab = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date & Time</TableCell>
            <TableCell>Doctor</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Notes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {patientData.appointments.map((appointment) => (
            <TableRow key={appointment.id}>
              <TableCell>
                <Typography variant="body2">{appointment.date}</Typography>
                <Typography variant="caption" color="text.secondary">{appointment.time}</Typography>
              </TableCell>
              <TableCell>{appointment.doctor}</TableCell>
              <TableCell>{appointment.department}</TableCell>
              <TableCell sx={{ textTransform: 'capitalize' }}>{appointment.type}</TableCell>
              <TableCell>
                <Chip
                  label={appointment.status}
                  color={getStatusColor(appointment.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>{appointment.notes}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderBillingTab = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        You have 1 pending invoice totaling $200.00
      </Alert>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patientData.invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.date}</TableCell>
                <TableCell>{invoice.description}</TableCell>
                <TableCell>{invoice.doctor}</TableCell>
                <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={invoice.status}
                    color={getStatusColor(invoice.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button size="small" startIcon={<DownloadIcon />}>
                    Download
                  </Button>
                  {invoice.status === 'pending' && (
                    <Button size="small" color="primary" sx={{ ml: 1 }}>
                      Pay Now
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Patient Portal
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your health information and medical records
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
          {activeTab === 0 && renderProfileTab()}
          {activeTab === 1 && renderMedicalRecordsTab()}
          {activeTab === 2 && renderAppointmentsTab()}
          {activeTab === 3 && renderBillingTab()}
        </Box>

        {/* Edit Profile Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  defaultValue={patientData.profile.firstName}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  defaultValue={patientData.profile.lastName}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Email"
                  defaultValue={patientData.profile.email}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  defaultValue={patientData.profile.phone}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  defaultValue={patientData.profile.address}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Emergency Contact"
                  defaultValue={patientData.profile.emergencyContact}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Save Changes</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default PatientPortal;
