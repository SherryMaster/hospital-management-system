/**
 * PatientQuickActions Component
 * 
 * Standardized quick actions section for patient pages
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';

const PatientQuickActions = ({
  title = 'Quick Actions',
  actions = [],
  sx = {},
}) => {
  const defaultActions = [
    {
      id: 'book-appointment',
      label: 'Book Appointment',
      icon: <AddIcon />,
      variant: 'contained',
      href: '/appointments/book',
      color: 'primary'
    },
    {
      id: 'view-records',
      label: 'View Records',
      icon: <AssignmentIcon />,
      variant: 'outlined',
      href: '/patient/portal',
      color: 'primary'
    },
    {
      id: 'view-invoices',
      label: 'View Invoices',
      icon: <ReceiptIcon />,
      variant: 'outlined',
      href: '/my-invoices',
      color: 'primary'
    },
    {
      id: 'edit-profile',
      label: 'Edit Profile',
      icon: <PersonIcon />,
      variant: 'outlined',
      href: '/patient/profile',
      color: 'primary'
    }
  ];

  const actionsToShow = actions.length > 0 ? actions : defaultActions;

  if (actionsToShow.length === 0) return null;

  const handleActionClick = (action) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      window.location.href = action.href;
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 3, ...sx }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Grid container spacing={2}>
        {actionsToShow.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.id}>
            <Button
              fullWidth
              variant={action.variant || 'outlined'}
              color={action.color || 'primary'}
              startIcon={action.icon}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
              sx={{ 
                py: 1.5,
                textTransform: 'none',
                fontWeight: action.variant === 'contained' ? 600 : 500,
                ...action.sx
              }}
            >
              {action.label}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default PatientQuickActions;
