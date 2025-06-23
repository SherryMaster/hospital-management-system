/**
 * DoctorsPage Component
 * 
 * Page for managing doctors in the hospital system
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
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  MedicalServices as DoctorIcon,
} from '@mui/icons-material';
import { MainLayout } from '../components/layout';
import { useAuth } from '../contexts/AuthContext';
import { useDoctors } from '../hooks/useApi';

const DoctorsPage = () => {
  const { user, logout } = useAuth();
  const {
    doctors,
    departments,
    pagination,
    loading,
    error,
    fetchDoctors,
    fetchDepartments,
  } = useDoctors();

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  useEffect(() => {
    loadDoctors();
    fetchDepartments();
  }, []);

  const loadDoctors = () => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (departmentFilter) params.department = departmentFilter;
    if (availabilityFilter) params.is_accepting_patients = availabilityFilter === 'true';
    fetchDoctors(params);
  };

  const handleSearch = () => {
    loadDoctors();
  };

  const getAvailabilityColor = (isAccepting) => {
    return isAccepting ? 'success' : 'default';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Doctor Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage doctor profiles and availability
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadDoctors}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                placeholder="Search doctors..."
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
                label="Department"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Availability"
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Available</MenuItem>
                <MenuItem value="false">Unavailable</MenuItem>
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

        {/* Doctors Table */}
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
                      <TableCell>Doctor</TableCell>
                      <TableCell>Doctor ID</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Specializations</TableCell>
                      <TableCell>Experience</TableCell>
                      <TableCell>Fee</TableCell>
                      <TableCell>Availability</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {doctors.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <DoctorIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                Dr. {doctor.user?.full_name || `${doctor.user?.first_name} ${doctor.user?.last_name}`.trim()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {doctor.user?.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {doctor.doctor_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {doctor.department_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {doctor.specializations_list?.slice(0, 2).map((spec, index) => (
                              <Chip
                                key={index}
                                label={spec}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            ))}
                            {doctor.specializations_list?.length > 2 && (
                              <Chip
                                label={`+${doctor.specializations_list.length - 2}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {doctor.years_of_experience ? `${doctor.years_of_experience} years` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {doctor.consultation_fee ? formatCurrency(doctor.consultation_fee) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={doctor.is_accepting_patients ? 'Available' : 'Unavailable'}
                            size="small"
                            color={getAvailabilityColor(doctor.is_accepting_patients)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => {/* TODO: Open doctor details */}}
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
                  Showing {doctors.length} of {pagination.count} doctors
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </MainLayout>
  );
};

export default DoctorsPage;
