/**
 * LoadingOverlay Component
 * 
 * Global loading overlay for API operations
 */

import React from 'react';
import {
  Backdrop,
  CircularProgress,
  Box,
  Typography,
  Fade,
} from '@mui/material';
import { useApp } from '../../contexts/AppContext';

const LoadingOverlay = () => {
  const { state } = useApp();
  const { loading } = state;

  const isGlobalLoading = loading.global;

  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}
      open={isGlobalLoading}
    >
      <Fade in={isGlobalLoading}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CircularProgress
            size={60}
            thickness={4}
            sx={{
              color: 'primary.main',
            }}
          />
          <Typography variant="h6" component="div">
            Loading...
          </Typography>
          <Typography variant="body2" component="div" sx={{ opacity: 0.8 }}>
            Please wait while we process your request
          </Typography>
        </Box>
      </Fade>
    </Backdrop>
  );
};

export default LoadingOverlay;
