/**
 * LoadingSpinner Component
 * 
 * Reusable loading spinner component with customizable size and message
 */

import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Backdrop,
  Card,
  CardContent,
} from '@mui/material';
import { LocalHospital as HospitalIcon } from '@mui/icons-material';

const LoadingSpinner = ({
  variant = 'circular',
  size = 'medium',
  message = 'Loading...',
  overlay = false,
  fullScreen = false,
  color = 'primary',
  sx = {},
}) => {
  const getSizeValue = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 60;
      case 'xlarge': return 80;
      default: return 40; // medium
    }
  };

  const getTypographyVariant = () => {
    switch (size) {
      case 'small': return 'caption';
      case 'large': return 'h6';
      case 'xlarge': return 'h5';
      default: return 'body2';
    }
  };

  const LoadingContent = () => {
    if (variant === 'linear') {
      return (
        <Box sx={{ width: '100%', ...sx }}>
          <LinearProgress color={color} />
          {message && (
            <Typography
              variant={getTypographyVariant()}
              align="center"
              sx={{ mt: 1 }}
              color="text.secondary"
            >
              {message}
            </Typography>
          )}
        </Box>
      );
    }

    if (variant === 'hospital') {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            ...sx,
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <CircularProgress
              size={getSizeValue()}
              color={color}
              thickness={4}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <HospitalIcon
                sx={{
                  fontSize: getSizeValue() * 0.4,
                  color: `${color}.main`,
                }}
              />
            </Box>
          </Box>
          {message && (
            <Typography
              variant={getTypographyVariant()}
              align="center"
              color="text.secondary"
            >
              {message}
            </Typography>
          )}
        </Box>
      );
    }

    // Default circular variant
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          ...sx,
        }}
      >
        <CircularProgress size={getSizeValue()} color={color} />
        {message && (
          <Typography
            variant={getTypographyVariant()}
            align="center"
            color="text.secondary"
          >
            {message}
          </Typography>
        )}
      </Box>
    );
  };

  if (fullScreen) {
    return (
      <Backdrop
        open={true}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'rgba(0, 0, 0, 0.7)',
        }}
      >
        <Card sx={{ p: 3, bgcolor: 'background.paper' }}>
          <CardContent>
            <LoadingContent />
          </CardContent>
        </Card>
      </Backdrop>
    );
  }

  if (overlay) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 1,
          ...sx,
        }}
      >
        <LoadingContent />
      </Box>
    );
  }

  return <LoadingContent />;
};

// Predefined loading components for common use cases
export const PageLoader = ({ message = 'Loading page...' }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
    }}
  >
    <LoadingSpinner variant="hospital" size="large" message={message} />
  </Box>
);

export const TableLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      py: 4,
    }}
  >
    <LoadingSpinner variant="circular" size="medium" message="Loading data..." />
  </Box>
);

export const ButtonLoader = ({ size = 'small' }) => (
  <CircularProgress size={size === 'small' ? 16 : 20} color="inherit" />
);

export const OverlayLoader = ({ message = 'Processing...' }) => (
  <LoadingSpinner overlay message={message} variant="hospital" />
);

export const FullScreenLoader = ({ message = 'Loading application...' }) => (
  <LoadingSpinner fullScreen message={message} variant="hospital" size="large" />
);

export default LoadingSpinner;
