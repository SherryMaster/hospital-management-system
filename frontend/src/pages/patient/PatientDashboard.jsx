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
  ContactPhone as ContactPhoneIcon,
} from '@mui/icons-material';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';
import { patientService, appointmentService, billingService } from '../../services/api';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    upcomingAppointments: [],
    recentAppointments: [],
    medicalHistory: [],
    pendingInvoices: [],
    patientProfile: {
      // Personal Information
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      date_of_birth: '',
      gender: '',
      age: '',

      // Address Information
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',

      // Emergency Contact
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: '',

      // Patient-Specific Information
      blood_type: '',
      marital_status: '',
      occupation: '',

      // Insurance Information
      insurance_provider: '',
      insurance_policy_number: '',
      insurance_group_number: '',

      // Medical History
      allergies: '',
      chronic_conditions: '',
      current_medications: '',
      family_medical_history: '',
      surgical_history: '',

      // Additional fields
      patient_id: '',
      registration_date: '',
      last_visit_date: '',
      height: '',
      weight: '',
      bmi: '',
      bmi_category: '',
    },
    healthSummary: {
      bloodType: '',
      allergies: [],
      currentMedications: [],
      chronicConditions: [],
    },
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user's patient profile and related data
      const [profileResult, upcomingAppointmentsResult, recentAppointmentsResult, invoicesResult] = await Promise.all([
        patientService.getMyProfile(),
        appointmentService.getAppointments({
          status: 'confirmed,pending',
          ordering: 'appointment_date',
          page_size: 10
        }),
        appointmentService.getAppointments({
          status: 'completed',
          ordering: '-appointment_date',
          page_size: 5
        }),
        billingService.getInvoices({
          status: 'pending,overdue',
          page_size: 10
        })
      ]);

      const dashboardData = {
        upcomingAppointments: [],
        recentAppointments: [],
        medicalHistory: [],
        pendingInvoices: [],
        patientProfile: {
          // Personal Information
          first_name: '',
          middle_name: '',
          last_name: '',
          email: '',
          phone_number: '',
          date_of_birth: '',
          gender: '',
          age: '',

          // Address Information
          address_line_1: '',
          address_line_2: '',
          city: '',
          state: '',
          postal_code: '',
          country: '',

          // Emergency Contact
          emergency_contact_name: '',
          emergency_contact_phone: '',
          emergency_contact_relationship: '',

          // Patient-Specific Information
          blood_type: '',
          marital_status: '',
          occupation: '',

          // Insurance Information
          insurance_provider: '',
          insurance_policy_number: '',
          insurance_group_number: '',

          // Medical History
          allergies: '',
          chronic_conditions: '',
          current_medications: '',
          family_medical_history: '',
          surgical_history: '',

          // Additional fields
          patient_id: '',
          registration_date: '',
          last_visit_date: '',
          height: '',
          weight: '',
          bmi: '',
          bmi_category: '',
        },
        healthSummary: {
          bloodType: '',
          allergies: [],
          currentMedications: [],
          chronicConditions: [],
        }
      };

      // Process upcoming appointments
      if (upcomingAppointmentsResult.data?.results) {
        dashboardData.upcomingAppointments = upcomingAppointmentsResult.data.results
          .filter(apt => new Date(apt.appointment_date) >= new Date())
          .map(apt => ({
            id: apt.id,
            doctor: apt.doctor?.user?.full_name || apt.doctor?.full_name || 'Unknown Doctor',
            department: apt.department?.name || apt.doctor?.department?.name || 'Unknown Department',
            date: apt.appointment_date,
            time: apt.appointment_time,
            type: apt.appointment_type || 'consultation',
            status: apt.status,
            notes: apt.notes
          }));
      }

      // Process recent appointments
      if (recentAppointmentsResult.data?.results) {
        dashboardData.recentAppointments = recentAppointmentsResult.data.results.map(apt => ({
          id: apt.id,
          doctor: apt.doctor?.user?.full_name || apt.doctor?.full_name || 'Unknown Doctor',
          department: apt.department?.name || apt.doctor?.department?.name || 'Unknown Department',
          date: apt.appointment_date,
          time: apt.appointment_time,
          type: apt.appointment_type || 'consultation',
          status: apt.status,
          diagnosis: apt.diagnosis || apt.notes || 'No diagnosis recorded'
        }));

        // Convert recent appointments to medical history format
        dashboardData.medicalHistory = dashboardData.recentAppointments.map(apt => ({
          id: apt.id,
          date: apt.date,
          type: apt.type === 'consultation' ? 'Consultation' :
                apt.type === 'follow-up' ? 'Follow-up' :
                apt.type === 'check-up' ? 'Checkup' : 'Visit',
          doctor: apt.doctor,
          notes: apt.diagnosis
        }));
      }

      // Process pending invoices
      if (invoicesResult.data?.results) {
        dashboardData.pendingInvoices = invoicesResult.data.results.map(invoice => ({
          id: invoice.id,
          date: invoice.issue_date || invoice.created_at,
          amount: parseFloat(invoice.total_amount || 0),
          description: invoice.description || `Invoice #${invoice.invoice_number}`,
          dueDate: invoice.due_date
        }));
      }

      // Process patient profile data
      if (profileResult.data) {
        const profile = profileResult.data;
        const userProfile = profile.user || {};

        // Populate comprehensive patient profile
        dashboardData.patientProfile = {
          // Personal Information from User model
          first_name: userProfile.first_name || '',
          middle_name: userProfile.middle_name || '',
          last_name: userProfile.last_name || '',
          email: userProfile.email || '',
          phone_number: userProfile.phone_number || '',
          date_of_birth: userProfile.date_of_birth || '',
          gender: userProfile.gender || '',
          age: profile.age || '',

          // Address Information from User model
          address_line_1: userProfile.address_line_1 || '',
          address_line_2: userProfile.address_line_2 || '',
          city: userProfile.city || '',
          state: userProfile.state || '',
          postal_code: userProfile.postal_code || '',
          country: userProfile.country || '',

          // Emergency Contact from User model
          emergency_contact_name: userProfile.emergency_contact_name || '',
          emergency_contact_phone: userProfile.emergency_contact_phone || '',
          emergency_contact_relationship: userProfile.emergency_contact_relationship || '',

          // Patient-Specific Information from Patient model
          blood_type: profile.blood_type || '',
          marital_status: profile.marital_status || '',
          occupation: profile.occupation || '',

          // Insurance Information from Patient model
          insurance_provider: profile.insurance_provider || '',
          insurance_policy_number: profile.insurance_policy_number || '',
          insurance_group_number: profile.insurance_group_number || '',

          // Medical History from Patient model
          allergies: profile.allergies || '',
          chronic_conditions: profile.chronic_conditions || '',
          current_medications: profile.current_medications || '',
          family_medical_history: profile.family_medical_history || '',
          surgical_history: profile.surgical_history || '',

          // Additional fields from Patient model
          patient_id: profile.patient_id || '',
          registration_date: profile.registration_date || '',
          last_visit_date: profile.last_visit_date || '',
          height: profile.height || '',
          weight: profile.weight || '',
          bmi: profile.bmi || '',
          bmi_category: profile.bmi_category || '',
        };

        // Process health summary for quick access
        dashboardData.healthSummary = {
          bloodType: profile.blood_type || 'Not specified',
          allergies: profile.allergies ? profile.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
          currentMedications: profile.current_medications ? profile.current_medications.split(',').map(m => m.trim()).filter(m => m) : [],
          chronicConditions: profile.chronic_conditions ? profile.chronic_conditions.split(',').map(c => c.trim()).filter(c => c) : []
        };
      }

      setDashboardData(dashboardData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                fontSize: '1.5rem'
              }}
            >
              {dashboardData.patientProfile.first_name?.charAt(0)}{dashboardData.patientProfile.last_name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome back, {dashboardData.patientProfile.first_name || user?.first_name || user?.full_name?.split(' ')[0] || 'Patient'}!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Patient ID: {dashboardData.patientProfile.patient_id || 'Loading...'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your health appointments and medical records
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
            <Button size="small" onClick={loadDashboardData} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        )}

        {/* Patient Profile Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Personal Information */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon color="primary" />
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Full Name</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {`${dashboardData.patientProfile.first_name} ${dashboardData.patientProfile.middle_name ? dashboardData.patientProfile.middle_name + ' ' : ''}${dashboardData.patientProfile.last_name}`.trim() || 'Not provided'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body1">
                      {dashboardData.patientProfile.date_of_birth ? new Date(dashboardData.patientProfile.date_of_birth).toLocaleDateString() : 'Not provided'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Age</Typography>
                    <Typography variant="body1">{dashboardData.patientProfile.age || 'Not calculated'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Gender</Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {dashboardData.patientProfile.gender === 'M' ? 'Male' : dashboardData.patientProfile.gender === 'F' ? 'Female' : dashboardData.patientProfile.gender || 'Not specified'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Marital Status</Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {dashboardData.patientProfile.marital_status || 'Not specified'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Occupation</Typography>
                    <Typography variant="body1">{dashboardData.patientProfile.occupation || 'Not specified'}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ContactPhoneIcon color="primary" />
                  Contact Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{dashboardData.patientProfile.email || 'Not provided'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Phone Number</Typography>
                    <Typography variant="body1">{dashboardData.patientProfile.phone_number || 'Not provided'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Address</Typography>
                    <Typography variant="body1">
                      {[
                        dashboardData.patientProfile.address_line_1,
                        dashboardData.patientProfile.address_line_2,
                        dashboardData.patientProfile.city,
                        dashboardData.patientProfile.state,
                        dashboardData.patientProfile.postal_code,
                        dashboardData.patientProfile.country
                      ].filter(Boolean).join(', ') || 'Not provided'}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="primary">Emergency Contact</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{dashboardData.patientProfile.emergency_contact_name || 'Not provided'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{dashboardData.patientProfile.emergency_contact_phone || 'Not provided'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Relationship</Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {dashboardData.patientProfile.emergency_contact_relationship || 'Not specified'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Medical & Insurance Information */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HospitalIcon color="primary" />
                  Medical & Insurance
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Blood Type</Typography>
                    <Typography variant="body1" fontWeight="bold" color="error.main">
                      {dashboardData.patientProfile.blood_type || 'Not specified'}
                    </Typography>
                  </Box>
                  {dashboardData.patientProfile.height && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">Height</Typography>
                      <Typography variant="body1">{dashboardData.patientProfile.height} cm</Typography>
                    </Box>
                  )}
                  {dashboardData.patientProfile.weight && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">Weight</Typography>
                      <Typography variant="body1">{dashboardData.patientProfile.weight} kg</Typography>
                    </Box>
                  )}
                  {dashboardData.patientProfile.bmi && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">BMI</Typography>
                      <Typography variant="body1">
                        {dashboardData.patientProfile.bmi} ({dashboardData.patientProfile.bmi_category})
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="primary">Insurance Information</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Provider</Typography>
                    <Typography variant="body1">{dashboardData.patientProfile.insurance_provider || 'Not provided'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Policy Number</Typography>
                    <Typography variant="body1">{dashboardData.patientProfile.insurance_policy_number || 'Not provided'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Group Number</Typography>
                    <Typography variant="body1">{dashboardData.patientProfile.insurance_group_number || 'Not provided'}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Medical History Overview */}
        {(dashboardData.patientProfile.allergies || dashboardData.patientProfile.chronic_conditions ||
          dashboardData.patientProfile.current_medications || dashboardData.patientProfile.family_medical_history ||
          dashboardData.patientProfile.surgical_history) && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MedicalIcon color="primary" />
                    Detailed Medical History
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={3}>
                    {dashboardData.patientProfile.allergies && (
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography variant="subtitle2" color="error.main" gutterBottom>
                            Allergies
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {dashboardData.patientProfile.allergies}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {dashboardData.patientProfile.chronic_conditions && (
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography variant="subtitle2" color="warning.main" gutterBottom>
                            Chronic Conditions
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {dashboardData.patientProfile.chronic_conditions}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {dashboardData.patientProfile.current_medications && (
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography variant="subtitle2" color="primary.main" gutterBottom>
                            Current Medications
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {dashboardData.patientProfile.current_medications}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {dashboardData.patientProfile.family_medical_history && (
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography variant="subtitle2" color="info.main" gutterBottom>
                            Family Medical History
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {dashboardData.patientProfile.family_medical_history}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {dashboardData.patientProfile.surgical_history && (
                      <Grid item xs={12}>
                        <Box>
                          <Typography variant="subtitle2" color="secondary.main" gutterBottom>
                            Surgical History
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {dashboardData.patientProfile.surgical_history}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<PersonIcon />}>
                    Edit Medical History
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        )}

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
                <Box sx={{ mb: 2 }}>
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
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Chronic Conditions
                  </Typography>
                  {dashboardData.healthSummary.chronicConditions.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {dashboardData.healthSummary.chronicConditions.map((condition, index) => (
                        <Chip key={index} label={condition} size="small" color="warning" variant="outlined" />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body1">No chronic conditions</Typography>
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
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ py: 1.5 }}
                onClick={() => window.location.href = '/appointments/book'}
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
                onClick={() => window.location.href = '/patient/portal'}
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
                onClick={() => window.location.href = '/my-invoices'}
                color={dashboardData.pendingInvoices.length > 0 ? 'warning' : 'primary'}
              >
                {dashboardData.pendingInvoices.length > 0 ? 'Pay Bills' : 'View Bills'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PersonIcon />}
                sx={{ py: 1.5 }}
                onClick={() => window.location.href = '/patient/profile'}
              >
                Update Profile
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Personalized Recommendations */}
        {(dashboardData.patientProfile.chronic_conditions ||
          dashboardData.upcomingAppointments.length === 0 ||
          !dashboardData.patientProfile.blood_type) && (
          <Paper sx={{ p: 3, mt: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              Personalized Recommendations
            </Typography>
            <Grid container spacing={2}>
              {!dashboardData.patientProfile.blood_type && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}>
                    <Typography variant="body2">
                      <strong>Complete Your Profile:</strong> Please update your blood type and other medical information for better healthcare service.
                    </Typography>
                  </Alert>
                </Grid>
              )}
              {dashboardData.upcomingAppointments.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}>
                    <Typography variant="body2">
                      <strong>Schedule Regular Checkup:</strong> It's been a while since your last appointment. Consider booking a routine checkup.
                    </Typography>
                  </Alert>
                </Grid>
              )}
              {dashboardData.patientProfile.chronic_conditions && (
                <Grid item xs={12}>
                  <Alert severity="warning" sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}>
                    <Typography variant="body2">
                      <strong>Chronic Condition Management:</strong> Don't forget to schedule regular follow-ups for your chronic conditions.
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}
      </Box>
    </MainLayout>
  );
};

export default PatientDashboard;
