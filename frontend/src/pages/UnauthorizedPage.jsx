/**
 * UnauthorizedPage Component
 * 
 * Page displayed when user doesn't have permission to access a resource
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
} from '@mui/material';
import {
  Block as BlockIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const requiredRoles = location.state?.requiredRoles || [];
  const from = location.state?.from?.pathname || '/';

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
        <Box sx={{ mb: 4 }}>
          <BlockIcon 
            sx={{ 
              fontSize: 80, 
              color: 'error.main',
              mb: 2 
            }} 
          />
          <Typography variant="h3" component="h1" gutterBottom color="error.main">
            Access Denied
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            You don't have permission to access this page
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="body1" paragraph>
            This page requires specific permissions that your account doesn't have.
          </Typography>
          
          {requiredRoles.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Required roles: {requiredRoles.join(', ')}
            </Typography>
          )}
        </Box>

        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          justifyContent="center"
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleGoBack}
            size="large"
          >
            Go Back
          </Button>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            size="large"
          >
            Go to Dashboard
          </Button>
        </Stack>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" color="info.dark">
            If you believe you should have access to this page, please contact your administrator.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default UnauthorizedPage;
