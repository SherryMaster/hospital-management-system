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
import { NotificationProvider } from './contexts/NotificationContext';
// import { AppProvider } from './contexts/AppContext';
import { ProtectedRoute } from './components';
import ErrorBoundary from './components/common/ErrorBoundary';
// import NotificationSystem from './components/common/NotificationSystem';
// import LoadingOverlay from './components/common/LoadingOverlay';

// Import pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import { AppointmentBooking, AppointmentCalendar, AppointmentManagement } from './pages/appointments';
import { PatientPortal, PatientProfile, MyAppointments, MyInvoices } from './pages/patient';
import { DoctorPortal } from './pages/doctor';
import UsersPage from './pages/admin/UsersPage';
import PatientsPage from './pages/PatientsPage';
import DoctorsPage from './pages/DoctorsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';
import BillingPage from './pages/BillingPage';
import SettingsPage from './pages/SettingsPage';

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

      {/* Management Routes */}
      <Route
        path="/users"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'receptionist']}>
            <PatientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctors"
        element={
          <ProtectedRoute requiredRoles={['admin', 'receptionist']}>
            <DoctorsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'receptionist']}>
            <AppointmentsPage />
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
      <Route
        path="/patient/profile"
        element={
          <ProtectedRoute requiredRoles={['patient']}>
            <PatientProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-appointments"
        element={
          <ProtectedRoute requiredRoles={['patient']}>
            <MyAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-invoices"
        element={
          <ProtectedRoute requiredRoles={['patient']}>
            <MyInvoices />
          </ProtectedRoute>
        }
      />

      {/* Additional Feature Routes */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medical-records"
        element={
          <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse']}>
            <MedicalRecordsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute requiredRoles={['admin', 'receptionist']}>
            <BillingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'patient']}>
            <SettingsPage />
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
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AuthProvider>
            <NotificationProvider>
              {/* <AppProvider> */}
                <Router>
                  <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                    <AppRoutes />
                    {/* <NotificationSystem />
                    <LoadingOverlay /> */}
                  </Box>
                </Router>
              {/* </AppProvider> */}
            </NotificationProvider>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
