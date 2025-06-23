/**
 * PatientPageHeader Component
 * 
 * Standardized header component for all patient pages
 */

import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Chip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

const PatientPageHeader = ({
  title,
  subtitle,
  user,
  showAvatar = false,
  showPatientId = false,
  showPersonalizedWelcome = false,
  patientProfile = null,
  actionButton = null,
  refreshAction = null,
  editAction = null,
  additionalInfo = null,
}) => {
  const getDisplayName = () => {
    if (showPersonalizedWelcome && patientProfile?.first_name) {
      return `Welcome back, ${patientProfile.first_name}!`;
    }
    if (showPersonalizedWelcome && user?.first_name) {
      return `Welcome back, ${user.first_name}!`;
    }
    if (user?.first_name && title.includes('Appointments')) {
      return `${user.first_name}'s Appointments`;
    }
    return title;
  };

  const getAvatarContent = () => {
    if (patientProfile?.first_name && patientProfile?.last_name) {
      return `${patientProfile.first_name.charAt(0)}${patientProfile.last_name.charAt(0)}`;
    }
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    if (user?.full_name) {
      const names = user.full_name.split(' ');
      return names.length > 1 ? `${names[0].charAt(0)}${names[1].charAt(0)}` : names[0].charAt(0);
    }
    return 'P';
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {showAvatar && (
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                fontSize: '1.5rem'
              }}
            >
              {getAvatarContent()}
            </Avatar>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {getDisplayName()}
            </Typography>
            {subtitle && (
              <Typography variant="body1" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {showPatientId && patientProfile?.patient_id && (
              <Typography variant="body2" color="text.secondary">
                Patient ID: {patientProfile.patient_id}
              </Typography>
            )}
            {additionalInfo && (
              <Typography variant="body2" color="primary.main" sx={{ mt: 1 }}>
                {additionalInfo}
              </Typography>
            )}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {refreshAction && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshAction.onClick}
              disabled={refreshAction.disabled}
            >
              {refreshAction.label || 'Refresh'}
            </Button>
          )}
          {editAction && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={editAction.onClick}
            >
              {editAction.label || 'Edit'}
            </Button>
          )}
          {actionButton && (
            <Button
              variant={actionButton.variant || 'contained'}
              startIcon={actionButton.icon}
              onClick={actionButton.onClick}
              disabled={actionButton.disabled}
            >
              {actionButton.label}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default PatientPageHeader;
