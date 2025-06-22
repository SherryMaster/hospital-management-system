/**
 * PatientsPage Component
 * 
 * Page for managing patients in the hospital system
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { MainLayout } from '../components/layout';
import { useAuth } from '../contexts/AuthContext';
import { usePatients } from '../hooks/useApi';

const PatientsPage = () => {
  const { user, logout } = useAuth();
  const {
    patients,
    pagination,
    loading,
    error,
    fetchPatients,
  } = usePatients();

  const [searchTerm, setSearchTerm] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = () => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (bloodTypeFilter) params.blood_type = bloodTypeFilter;
    if (sortBy) {
      params.ordering = sortOrder === 'desc' ? `-${sortBy}` : sortBy;
    }
    fetchPatients(params);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Trigger search when sort changes
  useEffect(() => {
    if (sortBy) {
      loadPatients();
    }
  }, [sortBy, sortOrder]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm || bloodTypeFilter || sortBy) {
        loadPatients();
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm, bloodTypeFilter]);

  const handleSearch = () => {
    loadPatients();
  };

  const getBloodTypeColor = (bloodType) => {
    switch (bloodType) {
      case 'O+': case 'O-': return 'error';
      case 'A+': case 'A-': return 'primary';
      case 'B+': case 'B-': return 'secondary';
      case 'AB+': case 'AB-': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Patient Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage patient records and information
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadPatients}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {/* TODO: Open create patient dialog */}}
            >
              Add Patient
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1 }}
              />
              <TextField
                select
                label="Blood Type"
                value={bloodTypeFilter}
                onChange={(e) => setBloodTypeFilter(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="A+">A+</MenuItem>
                <MenuItem value="A-">A-</MenuItem>
                <MenuItem value="B+">B+</MenuItem>
                <MenuItem value="B-">B-</MenuItem>
                <MenuItem value="AB+">AB+</MenuItem>
                <MenuItem value="AB-">AB-</MenuItem>
                <MenuItem value="O+">O+</MenuItem>
                <MenuItem value="O-">O-</MenuItem>
              </TextField>
              <TextField
                select
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="">Default</MenuItem>
                <MenuItem value="user__first_name">Name</MenuItem>
                <MenuItem value="patient_id">Patient ID</MenuItem>
                <MenuItem value="user__date_of_birth">Age</MenuItem>
                <MenuItem value="last_visit_date">Last Visit</MenuItem>
                <MenuItem value="created_at">Registration Date</MenuItem>
              </TextField>
              <Button variant="contained" onClick={handleSearch}>
                Search
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Patients Table */}
        <Card>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Patient ID</TableCell>
                      <TableCell>Age</TableCell>
                      <TableCell>Blood Type</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Last Visit</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <PersonIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {patient.user?.full_name || `${patient.user?.first_name} ${patient.user?.last_name}`.trim()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {patient.user?.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {patient.patient_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {patient.age || calculateAge(patient.user?.date_of_birth)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={patient.blood_type || 'Unknown'}
                            size="small"
                            color={getBloodTypeColor(patient.blood_type)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{patient.user?.phone_number || 'N/A'}</TableCell>
                        <TableCell>
                          {patient.last_visit_date ? formatDate(patient.last_visit_date) : 'Never'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => {/* TODO: Open patient details */}}
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {/* TODO: Open edit dialog */}}
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Pagination info */}
            {pagination && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {patients.length} of {pagination.count} patients
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </MainLayout>
  );
};

export default PatientsPage;
