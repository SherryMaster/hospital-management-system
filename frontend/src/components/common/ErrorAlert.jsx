/**
 * ErrorAlert Component
 * 
 * Reusable error alert component with customizable severity and actions
 */

import React from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Box,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const ErrorAlert = ({
  error,
  title = 'Error',
  severity = 'error',
  onClose,
  onRetry,
  showRetry = false,
  collapsible = false,
  open = true,
  sx = {},
}) => {
  const [isOpen, setIsOpen] = React.useState(open);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const getErrorMessage = (error) => {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error?.response?.data?.detail) {
      return error.response.data.detail;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  };

  const alertContent = (
    <Alert
      severity={severity}
      sx={sx}
      action={
        <Box display="flex" gap={1}>
          {showRetry && (
            <Button
              color="inherit"
              size="small"
              onClick={handleRetry}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          )}
          {onClose && (
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleClose}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          )}
        </Box>
      }
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      {getErrorMessage(error)}
    </Alert>
  );

  if (collapsible) {
    return (
      <Collapse in={isOpen}>
        {alertContent}
      </Collapse>
    );
  }

  return isOpen ? alertContent : null;
};

export default ErrorAlert;
