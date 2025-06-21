/**
 * Hospital Management System - Main App Component
 *
 * Root component that sets up theme, routing, and global providers.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Typography, Container, Paper } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';

// Temporary welcome component until we build the full app
const WelcomeScreen = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          🏥 Hospital Management System
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          A comprehensive, production-grade hospital management solution
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Typography variant="body1" paragraph>
            <strong>Backend:</strong> Django REST API with JWT Authentication
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Frontend:</strong> React with Material-UI
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Database:</strong> PostgreSQL (Neon)
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Architecture:</strong> Decoupled client-server with independent scaling
          </Typography>
        </Box>
        <Box sx={{ mt: 4, p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
          <Typography variant="h6" color="success.dark">
            ✅ Frontend Environment Setup Complete!
          </Typography>
          <Typography variant="body2" color="success.dark" sx={{ mt: 1 }}>
            React + Vite + Material-UI + Routing + API Integration Ready
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <Router>
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
              <Routes>
                <Route path="/" element={<WelcomeScreen />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Box>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
