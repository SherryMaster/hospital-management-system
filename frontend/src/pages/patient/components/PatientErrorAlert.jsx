/**
 * PatientErrorAlert Component
 * 
 * Standardized error alert component for patient pages
 */

import React from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Box,
  Typography,
  Collapse,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

const PatientErrorAlert = ({
  error,
  onClose = null,
  onRetry = null,
  severity = 'error',
  title = null,
  showDetails = false,
  retryLabel = 'Retry',
  sx = {},
}) => {
  const [showDetailedError, setShowDetailedError] = React.useState(false);

  if (!error) return null;

  const getErrorMessage = () => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.detail) return error.detail;
    if (error?.error) return error.error;
    return 'An unexpected error occurred. Please try again.';
  };

  const getErrorDetails = () => {
    if (typeof error === 'string') return null;
    
    const details = [];
    if (error?.code) details.push(`Code: ${error.code}`);
    if (error?.status) details.push(`Status: ${error.status}`);
    if (error?.timestamp) details.push(`Time: ${new Date(error.timestamp).toLocaleString()}`);
    
    return details.length > 0 ? details : null;
  };

  const errorDetails = getErrorDetails();
  const hasDetails = showDetails && errorDetails;

  return (
    <Alert 
      severity={severity} 
      onClose={onClose}
      sx={{ mb: 3, ...sx }}
      action={
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {hasDetails && (
            <Button
              size="small"
              onClick={() => setShowDetailedError(!showDetailedError)}
              endIcon={showDetailedError ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              Details
            </Button>
          )}
          {onRetry && (
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              variant="outlined"
              color={severity}
            >
              {retryLabel}
            </Button>
          )}
        </Box>
      }
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      <Typography variant="body2">
        {getErrorMessage()}
      </Typography>
      
      {hasDetails && (
        <Collapse in={showDetailedError}>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
            <Typography variant="caption" component="div" color="text.secondary">
              <strong>Error Details:</strong>
            </Typography>
            {errorDetails.map((detail, index) => (
              <Typography key={index} variant="caption" component="div" color="text.secondary">
                {detail}
              </Typography>
            ))}
          </Box>
        </Collapse>
      )}
    </Alert>
  );
};

export default PatientErrorAlert;
