/**
 * PatientLoadingState Component
 * 
 * Standardized loading state component for patient pages
 */

import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Skeleton,
  Card,
  CardContent,
  Grid,
} from '@mui/material';

const PatientLoadingState = ({
  type = 'circular', // 'circular', 'linear', 'skeleton'
  message = 'Loading your health information...',
  title = null,
  showTitle = false,
  fullHeight = false,
  skeletonRows = 3,
  skeletonCards = 4,
}) => {
  const getLoadingContent = () => {
    switch (type) {
      case 'linear':
        return (
          <Box>
            {showTitle && title && (
              <Typography variant="h4" gutterBottom>
                {title}
              </Typography>
            )}
            <LinearProgress sx={{ mb: 3 }} />
            <Typography variant="body1" color="text.secondary">
              {message}
            </Typography>
          </Box>
        );
      
      case 'skeleton':
        return (
          <Box>
            {showTitle && title && (
              <Skeleton variant="text" width="40%" height={48} sx={{ mb: 2 }} />
            )}
            
            {/* Skeleton Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {Array.from({ length: skeletonCards }).map((_, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card>
                    <CardContent>
                      <Skeleton variant="text" width="60%" height={20} />
                      <Skeleton variant="text" width="40%" height={32} sx={{ mt: 1 }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {/* Skeleton Rows */}
            <Card>
              <CardContent>
                <Skeleton variant="text" width="30%" height={24} sx={{ mb: 2 }} />
                {Array.from({ length: skeletonRows }).map((_, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Skeleton variant="text" width="100%" height={20} />
                    <Skeleton variant="text" width="80%" height={20} />
                    <Skeleton variant="text" width="60%" height={20} />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        );
      
      case 'circular':
      default:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              {message}
            </Typography>
          </Box>
        );
    }
  };

  const containerSx = {
    display: 'flex',
    justifyContent: type === 'skeleton' ? 'flex-start' : 'center',
    alignItems: type === 'skeleton' ? 'flex-start' : 'center',
    minHeight: fullHeight ? '60vh' : type === 'skeleton' ? 'auto' : '400px',
    width: '100%',
  };

  return (
    <Box sx={containerSx}>
      {type === 'skeleton' ? (
        <Box sx={{ width: '100%' }}>
          {getLoadingContent()}
        </Box>
      ) : (
        getLoadingContent()
      )}
    </Box>
  );
};

export default PatientLoadingState;
