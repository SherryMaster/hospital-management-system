/**
 * Hospital Management System - Main App Component
 *
 * Root component that sets up theme, routing, and global providers.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
// import { AppProvider } from './contexts/AppContext';
import { ProtectedRoute } from './components';
// import NotificationSystem from './components/common/NotificationSystem';
// import LoadingOverlay from './components/common/LoadingOverlay';

// Import pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import { AppointmentBooking, AppointmentCalendar, AppointmentManagement } from './pages/appointments';
import { PatientPortal } from './pages/patient';
import { DoctorPortal } from './pages/doctor';

// App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Appointment Routes */}
      <Route
        path="/appointments/book"
        element={
          <ProtectedRoute>
            <AppointmentBooking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments/calendar"
        element={
          <ProtectedRoute>
            <AppointmentCalendar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments/manage"
        element={
          <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'receptionist']}>
            <AppointmentManagement />
          </ProtectedRoute>
        }
      />

      {/* Portal Routes */}
      <Route
        path="/patient/portal"
        element={
          <ProtectedRoute requiredRoles={['patient']}>
            <PatientPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/portal"
        element={
          <ProtectedRoute requiredRoles={['doctor']}>
            <DoctorPortal />
          </ProtectedRoute>
        }
      />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          {/* <AppProvider> */}
            <Router>
              <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                <AppRoutes />
                {/* <NotificationSystem />
                <LoadingOverlay /> */}
              </Box>
            </Router>
          {/* </AppProvider> */}
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
