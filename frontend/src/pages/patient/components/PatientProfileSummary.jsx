/**
 * PatientProfileSummary Component
 *
 * Displays a summary of patient profile information on the dashboard
 * with a link to the full profile page for detailed editing
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Divider,
  Chip,
  Avatar,
  Grid,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Bloodtype as BloodtypeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PatientProfileSummary = ({ patientProfile, upcomingAppointments = [] }) => {
  const navigate = useNavigate();

  const getDisplayName = () => {
    const { first_name, middle_name, last_name } = patientProfile;
    return `${first_name || ''} ${middle_name ? middle_name + ' ' : ''}${last_name || ''}`.trim() || 'Not provided';
  };

  const getInitials = () => {
    const { first_name, last_name } = patientProfile;
    const firstInitial = first_name?.charAt(0)?.toUpperCase() || '';
    const lastInitial = last_name?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}` || 'P';
  };

  const getNextAppointment = () => {
    if (upcomingAppointments.length === 0) return null;
    
    // Sort appointments by date and get the next one
    const sortedAppointments = [...upcomingAppointments].sort((a, b) => 
      new Date(a.appointment_date) - new Date(b.appointment_date)
    );
    
    return sortedAppointments[0];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const nextAppointment = getNextAppointment();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          Profile Summary
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {/* Patient Avatar and Basic Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'primary.main',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              mr: 2
            }}
          >
            {getInitials()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              {getDisplayName()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Patient ID: {patientProfile.patient_id || 'Not assigned'}
            </Typography>
            {patientProfile.date_of_birth && (
              <Typography variant="body2" color="text.secondary">
                Age: {patientProfile.age || 'Not calculated'}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Key Information Grid */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Contact Info */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {patientProfile.email || 'No email provided'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {patientProfile.phone_number || 'No phone provided'}
              </Typography>
            </Box>
          </Grid>

          {/* Medical Info */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <BloodtypeIcon fontSize="small" color="error" />
              <Typography variant="body2" color="text.secondary">
                Blood Type: 
              </Typography>
              <Chip
                label={patientProfile.blood_type || 'Not specified'}
                size="small"
                color={patientProfile.blood_type ? 'error' : 'default'}
                variant="outlined"
              />
            </Box>
            {nextAppointment && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon fontSize="small" color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Next: {formatDate(nextAppointment.appointment_date)}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>

        {/* Profile Completion Status */}
        {(!patientProfile.blood_type || !patientProfile.phone_number || !patientProfile.emergency_contact_name) && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body2" color="warning.contrastText">
              <strong>Profile Incomplete:</strong> Please complete your profile for better healthcare service.
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate('/patient/profile')}
          size="small"
        >
          Edit Profile
        </Button>
        <Button
          variant="text"
          onClick={() => navigate('/patient/profile')}
          size="small"
        >
          View Full Profile
        </Button>
      </CardActions>
    </Card>
  );
};

export default PatientProfileSummary;
