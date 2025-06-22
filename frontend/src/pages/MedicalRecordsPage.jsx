/**
 * MedicalRecordsPage Component
 *
 * Medical records management for doctors, nurses, and administrators
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { MainLayout } from '../components/layout';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { medicalRecordsService } from '../services/api';

const MedicalRecordsPage = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real medical records from API
      const result = await medicalRecordsService.getMedicalRecords({ page_size: 100 });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch medical records');
      }

      // Process medical records data
      const processedRecords = (result.data?.results || []).map(record => ({
        id: record.id,
        patient: {
          id: record.patient?.id,
          full_name: record.patient?.user?.full_name || record.patient?.full_name || 'Unknown Patient',
          patient_id: record.patient?.patient_id || 'N/A'
        },
        doctor: {
          id: record.doctor?.id,
          full_name: record.doctor?.user?.full_name || record.doctor?.full_name || 'Unknown Doctor',
          specialization: record.doctor?.specializations?.[0]?.name ||
                        record.doctor?.department?.name ||
                        'General Medicine'
        },
        record_type: record.record_type || 'consultation',
        diagnosis: record.diagnosis || record.chief_complaint || 'No diagnosis recorded',
        symptoms: record.symptoms || record.chief_complaint || 'No symptoms recorded',
        treatment: record.treatment || record.treatment_plan || 'No treatment recorded',
        visit_date: record.visit_date || record.created_at,
        follow_up_date: record.follow_up_date,
        is_confidential: record.is_confidential || false,
        status: record.status || 'completed'
      }));

      setRecords(processedRecords);
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setError(err.message || 'Failed to load medical records. Please try again.');
      showNotification('Failed to load medical records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event, record) => {
    setAnchorEl(event.currentTarget);
    setSelectedRecord(record);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRecord(null);
  };

  const handleViewRecord = () => {
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleEditRecord = () => {
    showNotification('Edit functionality coming soon', 'info');
    handleMenuClose();
  };

  const handlePrintRecord = () => {
    showNotification('Print functionality coming soon', 'info');
    handleMenuClose();
  };

  const handleAddRecord = () => {
    showNotification('Add new record functionality coming soon', 'info');
  };

  const getRecordTypeColor = (type) => {
    switch (type) {
      case 'consultation':
        return 'primary';
      case 'diagnosis':
        return 'secondary';
      case 'treatment':
        return 'success';
      case 'surgery':
        return 'error';
      case 'lab_result':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'warning';
      case 'completed':
        return 'success';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };

  const filteredRecords = records.filter(record =>
    record.patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedRecords = filteredRecords.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
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
              Medical Records
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage patient medical records and treatment history
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddRecord}
          >
            Add Record
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Search and Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by patient name, ID, diagnosis, or doctor..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={() => showNotification('Filter functionality coming soon', 'info')}
                >
                  Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Records Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Diagnosis</TableCell>
                  <TableCell>Visit Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRecords.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {record.patient.full_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {record.patient.patient_id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {record.doctor.full_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {record.doctor.specialization}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.record_type.replace('_', ' ')}
                        color={getRecordTypeColor(record.record_type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.diagnosis}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(record.visit_date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        color={getStatusColor(record.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, record)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredRecords.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleViewRecord}>
            <VisibilityIcon sx={{ mr: 1 }} />
            View Details
          </MenuItem>
          <MenuItem onClick={handleEditRecord}>
            <EditIcon sx={{ mr: 1 }} />
            Edit Record
          </MenuItem>
          <MenuItem onClick={handlePrintRecord}>
            <PrintIcon sx={{ mr: 1 }} />
            Print
          </MenuItem>
        </Menu>

        {/* View Record Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Medical Record Details
          </DialogTitle>
          <DialogContent>
            {selectedRecord && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Patient Information
                  </Typography>
                  <Typography variant="body2">
                    Name: {selectedRecord.patient.full_name}
                  </Typography>
                  <Typography variant="body2">
                    ID: {selectedRecord.patient.patient_id}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Doctor Information
                  </Typography>
                  <Typography variant="body2">
                    Name: {selectedRecord.doctor.full_name}
                  </Typography>
                  <Typography variant="body2">
                    Specialization: {selectedRecord.doctor.specialization}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Medical Details
                  </Typography>
                  <Typography variant="body2">
                    Diagnosis: {selectedRecord.diagnosis}
                  </Typography>
                  <Typography variant="body2">
                    Symptoms: {selectedRecord.symptoms}
                  </Typography>
                  <Typography variant="body2">
                    Treatment: {selectedRecord.treatment}
                  </Typography>
                  <Typography variant="body2">
                    Visit Date: {new Date(selectedRecord.visit_date).toLocaleDateString()}
                  </Typography>
                  {selectedRecord.follow_up_date && (
                    <Typography variant="body2">
                      Follow-up Date: {new Date(selectedRecord.follow_up_date).toLocaleDateString()}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default MedicalRecordsPage;
