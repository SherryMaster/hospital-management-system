/**
 * DashboardPage Component
 *
 * Main dashboard page with role-based routing to specific dashboards
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminDashboard } from './admin';
import { DoctorDashboard } from './doctor';
import { PatientDashboard } from './patient';
import { Box, Typography, CircularProgress } from '@mui/material';
import { MainLayout } from '../components/layout';

const DashboardPage = () => {
  const { user, logout, isLoading } = useAuth();

  // Show loading while authentication is being checked
  if (isLoading) {
    return (
      <MainLayout user={user} onLogout={logout}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
          flexDirection="column"
          gap={2}
        >
          <CircularProgress size={60} />
          <Typography variant="body1" color="text.secondary">
            Loading dashboard...
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  // Route to appropriate dashboard based on user role
  const userRole = user?.role?.toLowerCase();

  switch (userRole) {
    case 'admin':
      return <AdminDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'patient':
      return <PatientDashboard />;
    case 'nurse':
    case 'receptionist':
    case 'pharmacist':
      // For now, these roles use the doctor dashboard
      // TODO: Create specific dashboards for these roles
      return <DoctorDashboard />;
    default:
      // Fallback for unknown roles
      return (
        <MainLayout user={user} onLogout={logout}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h4" gutterBottom color="error">
              Access Denied
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your account role is not recognized or you don't have access to the dashboard.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Role: {user?.role || 'Unknown'}
            </Typography>
          </Box>
        </MainLayout>
      );
  }


};

export default DashboardPage;
