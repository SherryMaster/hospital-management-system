import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fab,
  CircularProgress,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { departmentService } from '../../services/api';

const DepartmentsPage = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  
  // State management
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'view'
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    head_of_department: '',
    phone_number: '',
    email: '',
    location: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Load departments on component mount
  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const { data, error } = await departmentService.getDepartments();
      if (data && !error) {
        setDepartments(data.results || data);
      } else {
        showNotification('Failed to load departments', 'error');
      }
    } catch (err) {
      showNotification('Error loading departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter departments based on search term
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form input changes
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Department name is required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle dialog open for different modes
  const handleDialogOpen = (mode, department = null) => {
    setDialogMode(mode);
    setSelectedDepartment(department);
    
    if (department) {
      setFormData({
        name: department.name || '',
        description: department.description || '',
        head_of_department: department.head_of_department || '',
        phone_number: department.phone_number || '',
        email: department.email || '',
        location: department.location || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        head_of_department: '',
        phone_number: '',
        email: '',
        location: '',
      });
    }
    
    setFormErrors({});
    setDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedDepartment(null);
    setFormData({
      name: '',
      description: '',
      head_of_department: '',
      phone_number: '',
      email: '',
      location: '',
    });
    setFormErrors({});
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      let result;

      // Clean up form data - remove empty strings for optional fields
      const cleanedData = {
        ...formData,
        head_of_department: formData.head_of_department || null,
        phone_number: formData.phone_number || null,
        email: formData.email || null,
        location: formData.location || null,
        description: formData.description || null,
      };

      if (dialogMode === 'create') {
        result = await departmentService.createDepartment(cleanedData);
      } else if (dialogMode === 'edit') {
        result = await departmentService.updateDepartment(selectedDepartment.id, cleanedData);
      }

      if (result.data && !result.error) {
        showNotification(
          `Department ${dialogMode === 'create' ? 'created' : 'updated'} successfully`,
          'success'
        );
        handleDialogClose();
        loadDepartments();
      } else {
        showNotification(
          result.error?.message || `Failed to ${dialogMode} department`,
          'error'
        );
      }
    } catch (err) {
      showNotification(`Error ${dialogMode === 'create' ? 'creating' : 'updating'} department`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (department) => {
    setDepartmentToDelete(department);
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!departmentToDelete) return;

    try {
      const result = await departmentService.deleteDepartment(departmentToDelete.id);

      if (result.data && !result.error) {
        showNotification('Department deleted successfully', 'success');
        loadDepartments();
      } else {
        showNotification(
          result.error?.message || 'Failed to delete department',
          'error'
        );
      }
    } catch (err) {
      showNotification('Error deleting department', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

  // Handle menu actions
  const handleMenuClick = (event, department) => {
    setAnchorEl(event.currentTarget);
    setSelectedDepartment(department);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDepartment(null);
  };

  // Calculate department statistics
  const totalDepartments = departments.length;
  const activeDepartments = departments.filter(dept => dept.is_active).length;
  const totalDoctors = departments.reduce((sum, dept) => sum + (dept.doctor_count || 0), 0);

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Department Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleDialogOpen('create')}
            size="large"
          >
            Add Department
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <BusinessIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{totalDepartments}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Departments
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <BusinessIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{activeDepartments}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Departments
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <PeopleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{totalDoctors}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Doctors
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {totalDoctors > 0 ? (totalDoctors / activeDepartments).toFixed(1) : '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Doctors/Dept
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Actions */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadDepartments}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Departments Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Departments ({filteredDepartments.length})
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Department</TableCell>
                      <TableCell>Head of Department</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Doctors</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDepartments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            {searchTerm ? 'No departments found matching your search.' : 'No departments found.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDepartments.map((department) => (
                        <TableRow key={department.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {department.name}
                              </Typography>
                              {department.description && (
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {department.description}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {department.head_of_department_name ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                                  {department.head_of_department_name.charAt(0)}
                                </Avatar>
                                <Typography variant="body2">
                                  {department.head_of_department_name}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Not assigned
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {department.location ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  {department.location}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Not specified
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box>
                              {department.phone_number && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <PhoneIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                                  <Typography variant="body2">
                                    {department.phone_number}
                                  </Typography>
                                </Box>
                              )}
                              {department.email && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <EmailIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                                  <Typography variant="body2">
                                    {department.email}
                                  </Typography>
                                </Box>
                              )}
                              {!department.phone_number && !department.email && (
                                <Typography variant="body2" color="text.secondary">
                                  Not provided
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${department.doctor_count || 0} doctors`}
                              size="small"
                              color={department.doctor_count > 0 ? 'primary' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={department.is_active ? 'Active' : 'Inactive'}
                              size="small"
                              color={department.is_active ? 'success' : 'default'}
                              variant={department.is_active ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="More actions">
                              <IconButton
                                onClick={(e) => handleMenuClick(e, department)}
                                size="small"
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => {
            handleDialogOpen('view', selectedDepartment);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            handleDialogOpen('edit', selectedDepartment);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Department</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => handleDeleteClick(selectedDepartment)}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Department</ListItemText>
          </MenuItem>
        </Menu>

        {/* Create/Edit/View Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleDialogClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {dialogMode === 'create' && 'Create New Department'}
            {dialogMode === 'edit' && 'Edit Department'}
            {dialogMode === 'view' && 'Department Details'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="name"
                    label="Department Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                    required
                    disabled={dialogMode === 'view'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="location"
                    label="Location"
                    value={formData.location}
                    onChange={handleInputChange}
                    error={!!formErrors.location}
                    helperText={formErrors.location}
                    disabled={dialogMode === 'view'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="description"
                    label="Description"
                    value={formData.description}
                    onChange={handleInputChange}
                    error={!!formErrors.description}
                    helperText={formErrors.description}
                    disabled={dialogMode === 'view'}
                    placeholder="Enter department description..."
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="phone_number"
                    label="Phone Number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    error={!!formErrors.phone_number}
                    helperText={formErrors.phone_number}
                    disabled={dialogMode === 'view'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="email"
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    disabled={dialogMode === 'view'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>
              {dialogMode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {dialogMode !== 'view' && (
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={submitting}
              >
                {submitting ? (
                  <CircularProgress size={20} />
                ) : (
                  dialogMode === 'create' ? 'Create Department' : 'Update Department'
                )}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the department "{departmentToDelete?.name}"?
            </Typography>
            {departmentToDelete?.doctor_count > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This department has {departmentToDelete.doctor_count} doctor(s) assigned.
                Please reassign them before deleting the department.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={departmentToDelete?.doctor_count > 0}
            >
              Delete Department
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </MainLayout>
  );
};

export default DepartmentsPage;
