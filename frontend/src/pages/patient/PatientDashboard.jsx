/**
 * PatientDashboard Component
 * 
 * Patient-specific dashboard with appointment history, medical records, and booking interface
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
  Divider,
  LinearProgress,
  Paper,
  Alert,

} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  LocalHospital as HospitalIcon,
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Add as AddIcon,
  History as HistoryIcon,
  MedicalServices as MedicalIcon,
  Medication as MedicationIcon,
  Phone as PhoneIcon,
  VideoCall as VideoCallIcon,
  Download as DownloadIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    upcomingAppointments: [],
    recentAppointments: [],
    medicalHistory: [],
    pendingInvoices: [],
    healthSummary: {
      bloodType: '',
      allergies: [],
      currentMedications: [],
    },
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
          upcomingAppointments: [
            {
              id: 1,
              doctor: 'Dr. Smith',
              department: 'Cardiology',
              date: '2024-01-25',
              time: '10:00 AM',
              type: 'consultation',
              status: 'confirmed',
            },
            {
              id: 2,
              doctor: 'Dr. Johnson',
              department: 'General Medicine',
              date: '2024-02-01',
              time: '02:30 PM',
              type: 'follow-up',
              status: 'pending',
            },
          ],
          recentAppointments: [
            {
              id: 3,
              doctor: 'Dr. Wilson',
              department: 'General Medicine',
              date: '2024-01-15',
              time: '09:00 AM',
              type: 'check-up',
              status: 'completed',
              diagnosis: 'Regular checkup - All normal',
            },
            {
              id: 4,
              doctor: 'Dr. Brown',
              department: 'Dermatology',
              date: '2024-01-10',
              time: '11:30 AM',
              type: 'consultation',
              status: 'completed',
              diagnosis: 'Skin condition treated',
            },
          ],
          medicalHistory: [
            {
              id: 1,
              date: '2024-01-15',
              type: 'Checkup',
              doctor: 'Dr. Wilson',
              notes: 'Regular health checkup - All vitals normal',
            },
            {
              id: 2,
              date: '2024-01-10',
              type: 'Treatment',
              doctor: 'Dr. Brown',
              notes: 'Skin condition treatment completed',
            },
            {
              id: 3,
              date: '2023-12-20',
              type: 'Lab Results',
              doctor: 'Dr. Smith',
              notes: 'Blood work results - All within normal range',
            },
          ],
          pendingInvoices: [
            {
              id: 1,
              date: '2024-01-15',
              amount: 150.00,
              description: 'Consultation Fee - Dr. Wilson',
              dueDate: '2024-02-15',
            },
            {
              id: 2,
              date: '2024-01-10',
              amount: 200.00,
              description: 'Dermatology Treatment - Dr. Brown',
              dueDate: '2024-02-10',
            },
          ],
          healthSummary: {
            bloodType: 'O+',
            allergies: ['Penicillin', 'Shellfish'],
            currentMedications: ['Vitamin D3', 'Multivitamin'],
          },
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
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getAppointmentTypeIcon = (type) => {
    switch (type) {
      case 'consultation': return <AssignmentIcon />;
      case 'follow-up': return <HistoryIcon />;
      case 'check-up': return <HospitalIcon />;
      default: return <CalendarIcon />;
    }
  };

  const StatCard = ({ title, value, icon, color, action }) => (
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
          <Box>
            <Typography variant="h4" component="div" color={`${color}.main`}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
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
            Patient Dashboard
          </Typography>
          <LinearProgress sx={{ mb: 3 }} />
          <Typography variant="body1" color="text.secondary">
            Loading your health information...
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
            Welcome back, {user?.first_name || user?.full_name?.split(' ')[0] || 'Patient'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your health appointments and medical records
          </Typography>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Upcoming Appointments"
              value={dashboardData.upcomingAppointments.length}
              icon={<CalendarIcon />}
              color="primary"
              action="Book New"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Medical Records"
              value={dashboardData.medicalHistory.length}
              icon={<AssignmentIcon />}
              color="info"
              action="View All"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Invoices"
              value={dashboardData.pendingInvoices.length}
              icon={<ReceiptIcon />}
              color="warning"
              action="Pay Now"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Health Summary"
              value="Updated"
              icon={<HospitalIcon />}
              color="success"
              action="View Details"
            />
          </Grid>
        </Grid>

        {/* Pending Invoices Alert */}
        {dashboardData.pendingInvoices.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            You have {dashboardData.pendingInvoices.length} pending invoice(s) totaling $
            {dashboardData.pendingInvoices.reduce((sum, invoice) => sum + invoice.amount, 0).toFixed(2)}
            <Button size="small" sx={{ ml: 2 }}>
              Pay Now
            </Button>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Upcoming Appointments */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Upcoming Appointments
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                  >
                    Book Appointment
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {dashboardData.upcomingAppointments.length > 0 ? (
                  <List>
                    {dashboardData.upcomingAppointments.map((appointment, index) => (
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
                                  {appointment.doctor} - {appointment.department}
                                </span>
                                <Chip
                                  label={appointment.status}
                                  size="small"
                                  color={getStatusColor(appointment.status)}
                                  variant="outlined"
                                />
                              </Box>
                            }
                            secondary={`${appointment.date} at ${appointment.time} • ${appointment.type}`}
                          />
                        </ListItem>
                        {index < dashboardData.upcomingAppointments.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    No upcoming appointments. Book your next appointment today!
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Recent Medical History */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Medical History
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {dashboardData.medicalHistory.slice(0, 3).map((record, index) => (
                    <React.Fragment key={record.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <MedicalIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${record.type} - ${record.doctor}`}
                          secondary={
                            <React.Fragment>
                              <span style={{ display: 'block', color: 'rgba(0, 0, 0, 0.6)' }}>
                                {record.date}
                              </span>
                              <span style={{ display: 'block' }}>
                                {record.notes}
                              </span>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      {index < dashboardData.medicalHistory.slice(0, 3).length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<HistoryIcon />}>
                  View Full History
                </Button>
                <Button size="small" startIcon={<DownloadIcon />}>
                  Download Records
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Health Summary */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Health Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Blood Type
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {dashboardData.healthSummary.bloodType}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Allergies
                  </Typography>
                  {dashboardData.healthSummary.allergies.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {dashboardData.healthSummary.allergies.map((allergy, index) => (
                        <Chip key={index} label={allergy} size="small" color="error" variant="outlined" />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body1">No known allergies</Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Current Medications
                  </Typography>
                  {dashboardData.healthSummary.currentMedications.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {dashboardData.healthSummary.currentMedications.map((medication, index) => (
                        <Chip key={index} label={medication} size="small" color="primary" variant="outlined" />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body1">No current medications</Typography>
                  )}
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<MedicationIcon />}>
                  Update Info
                </Button>
              </CardActions>
            </Card>

            {/* Pending Invoices */}
            {dashboardData.pendingInvoices.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Pending Invoices
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <List dense>
                    {dashboardData.pendingInvoices.map((invoice, index) => (
                      <React.Fragment key={invoice.id}>
                        <ListItem>
                          <ListItemText
                            primary={`$${invoice.amount.toFixed(2)}`}
                            secondary={
                              <React.Fragment>
                                <span style={{ display: 'block', fontSize: '0.75rem' }}>
                                  {invoice.description}
                                </span>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#d32f2f' }}>
                                  Due: {invoice.dueDate}
                                </span>
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                        {index < dashboardData.pendingInvoices.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<PaymentIcon />} color="primary">
                    Pay All
                  </Button>
                  <Button size="small">View Details</Button>
                </CardActions>
              </Card>
            )}
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
                Book Appointment
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AssignmentIcon />}
                sx={{ py: 1.5 }}
              >
                View Records
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ReceiptIcon />}
                sx={{ py: 1.5 }}
              >
                Pay Bills
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PersonIcon />}
                sx={{ py: 1.5 }}
              >
                Update Profile
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default PatientDashboard;
