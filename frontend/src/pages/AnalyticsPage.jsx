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
import { patientService, doctorService, appointmentService, billingService } from '../services/api';

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

      // Fetch real data from multiple API endpoints
      const [patientsResult, doctorsResult, appointmentsResult, billingResult] = await Promise.all([
        patientService.getPatients({ page_size: 1000 }),
        doctorService.getDoctors({ page_size: 1000 }),
        appointmentService.getAppointments({ page_size: 1000 }),
        billingService.getInvoices({ page_size: 1000 })
      ]);

      // Process the data
      const patients = patientsResult.data?.results || [];
      const doctors = doctorsResult.data?.results || [];
      const appointments = appointmentsResult.data?.results || [];
      const invoices = billingResult.data?.results || [];

      // Calculate overview statistics
      const totalRevenue = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0);

      // Calculate monthly growth (simplified - comparing current month to previous)
      const currentMonth = new Date().getMonth();
      const currentMonthPatients = patients.filter(p => new Date(p.created_at).getMonth() === currentMonth).length;
      const previousMonthPatients = patients.filter(p => new Date(p.created_at).getMonth() === currentMonth - 1).length;
      const monthlyGrowth = previousMonthPatients > 0 ? ((currentMonthPatients - previousMonthPatients) / previousMonthPatients * 100) : 0;

      // Generate trends data (last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonthIndex = new Date().getMonth();
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonthIndex - i + 12) % 12;
        last6Months.push(months[monthIndex]);
      }

      const patientRegistrations = last6Months.map(month => {
        const monthIndex = months.indexOf(month);
        const count = patients.filter(p => new Date(p.created_at).getMonth() === monthIndex).length;
        return { month, count };
      });

      const appointmentBookings = last6Months.map(month => {
        const monthIndex = months.indexOf(month);
        const count = appointments.filter(a => new Date(a.appointment_date).getMonth() === monthIndex).length;
        return { month, count };
      });

      const revenueData = last6Months.map(month => {
        const monthIndex = months.indexOf(month);
        const amount = invoices
          .filter(i => new Date(i.issue_date || i.created_at).getMonth() === monthIndex)
          .reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0);
        return { month, amount };
      });

      // Calculate demographics
      const ageGroups = [
        { group: '0-18', count: 0 },
        { group: '19-35', count: 0 },
        { group: '36-50', count: 0 },
        { group: '51-65', count: 0 },
        { group: '65+', count: 0 },
      ];

      patients.forEach(patient => {
        if (patient.date_of_birth) {
          const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();
          if (age <= 18) ageGroups[0].count++;
          else if (age <= 35) ageGroups[1].count++;
          else if (age <= 50) ageGroups[2].count++;
          else if (age <= 65) ageGroups[3].count++;
          else ageGroups[4].count++;
        }
      });

      const genderDistribution = [
        { gender: 'Male', count: patients.filter(p => p.gender === 'M' || p.gender === 'male').length },
        { gender: 'Female', count: patients.filter(p => p.gender === 'F' || p.gender === 'female').length },
        { gender: 'Other', count: patients.filter(p => p.gender && !['M', 'F', 'male', 'female'].includes(p.gender)).length },
      ];

      // Department statistics
      const departmentStats = {};
      appointments.forEach(appointment => {
        const deptName = appointment.department?.name || appointment.doctor?.department?.name || 'Unknown';
        if (!departmentStats[deptName]) {
          departmentStats[deptName] = new Set();
        }
        if (appointment.patient?.id) {
          departmentStats[deptName].add(appointment.patient.id);
        }
      });

      const departmentStatsArray = Object.entries(departmentStats).map(([department, patientSet]) => ({
        department,
        patients: patientSet.size
      }));

      const analyticsData = {
        overview: {
          totalPatients: patients.length,
          totalDoctors: doctors.length,
          totalAppointments: appointments.length,
          totalRevenue: Math.round(totalRevenue),
          monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
        },
        trends: {
          patientRegistrations,
          appointmentBookings,
          revenueData,
        },
        demographics: {
          ageGroups,
          genderDistribution,
          departmentStats: departmentStatsArray,
        },
      };

      setAnalyticsData(analyticsData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err.message || 'Failed to load analytics data. Please try again.');
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
