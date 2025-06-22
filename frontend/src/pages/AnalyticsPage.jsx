/**
 * AnalyticsPage Component
 *
 * Analytics dashboard for system administrators
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  LocalHospital as LocalHospitalIcon,
  CalendarToday as CalendarTodayIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { MainLayout } from '../components/layout';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import api from '../services/api';

const AnalyticsPage = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalPatients: 0,
      totalDoctors: 0,
      totalAppointments: 0,
      totalRevenue: 0,
      monthlyGrowth: 0,
    },
    trends: {
      patientRegistrations: [],
      appointmentBookings: [],
      revenueData: [],
    },
    demographics: {
      ageGroups: [],
      genderDistribution: [],
      departmentStats: [],
    },
  });

  const tabLabels = ['Overview', 'Trends', 'Demographics', 'Reports'];

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll use mock data since the analytics endpoints might not be implemented yet
      // TODO: Replace with actual API calls when analytics endpoints are available
      const mockData = {
        overview: {
          totalPatients: 1250,
          totalDoctors: 45,
          totalAppointments: 3420,
          totalRevenue: 125000,
          monthlyGrowth: 12.5,
        },
        trends: {
          patientRegistrations: [
            { month: 'Jan', count: 120 },
            { month: 'Feb', count: 135 },
            { month: 'Mar', count: 150 },
            { month: 'Apr', count: 142 },
            { month: 'May', count: 168 },
            { month: 'Jun', count: 180 },
          ],
          appointmentBookings: [
            { month: 'Jan', count: 450 },
            { month: 'Feb', count: 520 },
            { month: 'Mar', count: 580 },
            { month: 'Apr', count: 610 },
            { month: 'May', count: 650 },
            { month: 'Jun', count: 720 },
          ],
          revenueData: [
            { month: 'Jan', amount: 18000 },
            { month: 'Feb', amount: 20500 },
            { month: 'Mar', amount: 22000 },
            { month: 'Apr', amount: 21500 },
            { month: 'May', amount: 24000 },
            { month: 'Jun', amount: 26500 },
          ],
        },
        demographics: {
          ageGroups: [
            { group: '0-18', count: 180 },
            { group: '19-35', count: 420 },
            { group: '36-50', count: 380 },
            { group: '51-65', count: 200 },
            { group: '65+', count: 70 },
          ],
          genderDistribution: [
            { gender: 'Male', count: 580 },
            { gender: 'Female', count: 620 },
            { gender: 'Other', count: 50 },
          ],
          departmentStats: [
            { department: 'Cardiology', patients: 220 },
            { department: 'Neurology', patients: 180 },
            { department: 'Orthopedics', patients: 250 },
            { department: 'Pediatrics', patients: 200 },
            { department: 'General Medicine', patients: 400 },
          ],
        },
      };

      setAnalyticsData(mockData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
      showNotification('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExportData = () => {
    handleMenuClose();
    showNotification('Export functionality coming soon', 'info');
  };

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PeopleIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Patients</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {analyticsData.overview.totalPatients.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              +{analyticsData.overview.monthlyGrowth}% this month
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocalHospitalIcon color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Doctors</Typography>
            </Box>
            <Typography variant="h4" color="secondary">
              {analyticsData.overview.totalDoctors}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active staff members
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CalendarTodayIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Appointments</Typography>
            </Box>
            <Typography variant="h4" color="info">
              {analyticsData.overview.totalAppointments.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total scheduled
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ReceiptIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Revenue</Typography>
            </Box>
            <Typography variant="h4" color="success">
              ${analyticsData.overview.totalRevenue.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total collected
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTrendsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monthly Trends
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Detailed trend analysis will be available once chart components are integrated.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Patient Registrations (Last 6 months)</Typography>
              {analyticsData.trends.patientRegistrations.map((item, index) => (
                <Typography key={index} variant="body2">
                  {item.month}: {item.count} patients
                </Typography>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderDemographicsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Age Distribution
            </Typography>
            {analyticsData.demographics.ageGroups.map((group, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">{group.group}</Typography>
                <Typography variant="body2" fontWeight="bold">{group.count}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Department Statistics
            </Typography>
            {analyticsData.demographics.departmentStats.map((dept, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">{dept.department}</Typography>
                <Typography variant="body2" fontWeight="bold">{dept.patients}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderReportsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Reports & Exports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generate and download detailed reports for various time periods and departments.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                • Monthly patient reports
              </Typography>
              <Typography variant="body2">
                • Revenue analysis
              </Typography>
              <Typography variant="body2">
                • Department performance
              </Typography>
              <Typography variant="body2">
                • Custom date range reports
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <MainLayout user={user} onLogout={logout}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              System performance metrics and insights
            </Typography>
          </Box>
          <Box>
            <IconButton onClick={handleRefresh} color="primary" disabled={loading}>
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleExportData}>
                <DownloadIcon sx={{ mr: 1 }} />
                Export Data
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabLabels.map((label, index) => (
              <Tab key={index} label={label} />
            ))}
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box>
          {activeTab === 0 && renderOverviewTab()}
          {activeTab === 1 && renderTrendsTab()}
          {activeTab === 2 && renderDemographicsTab()}
          {activeTab === 3 && renderReportsTab()}
        </Box>
      </Box>
    </MainLayout>
  );
};

export default AnalyticsPage;
