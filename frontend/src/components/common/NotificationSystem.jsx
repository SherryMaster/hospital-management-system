/**
 * NotificationSystem Component
 * 
 * Global notification system for displaying success, error, warning, and info messages
 */

import React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  IconButton,
  Slide,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useApp } from '../../contexts/AppContext';

const SlideTransition = (props) => {
  return <Slide {...props} direction="down" />;
};

const NotificationSystem = () => {
  const { state, actions } = useApp();
  const { notifications } = state.ui;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <SuccessIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
      default:
        return <InfoIcon />;
    }
  };

  const getSeverity = (type) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  const handleClose = (notificationId) => {
    actions.removeNotification(notificationId);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        maxWidth: 400,
      }}
    >
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          TransitionComponent={SlideTransition}
          sx={{
            position: 'relative',
            transform: 'none !important',
            left: 'auto !important',
            right: 'auto !important',
            top: 'auto !important',
            bottom: 'auto !important',
          }}
        >
          <Alert
            severity={getSeverity(notification.type)}
            icon={getIcon(notification.type)}
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={() => handleClose(notification.id)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
            sx={{
              width: '100%',
              boxShadow: 3,
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}
          >
            {notification.title && (
              <AlertTitle>{notification.title}</AlertTitle>
            )}
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
};

export default NotificationSystem;
