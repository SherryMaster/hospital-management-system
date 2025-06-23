/**
 * UsersPage Component
 * 
 * Admin page for managing users in the hospital system
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useUsers } from '../../hooks/useApi';
import { TableLoader } from '../../components/common/LoadingSpinner';
import AdminUserCreateDialog from '../../components/forms/AdminUserCreateDialog';

const UsersPage = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotification();
  const {
    users,
    pagination,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  } = useUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'patient',
    phone_number: '',
    password: '',
    password_confirm: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = useCallback(() => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (roleFilter) params.role = roleFilter;
    fetchUsers(params);
  }, [searchTerm, roleFilter, fetchUsers]);

  const handleSearch = useCallback(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDeleteClick = useCallback((userToDelete) => {
    setUserToDelete(userToDelete);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      const result = await deleteUser(userToDelete.id);
      if (result.data) {
        showSuccess(`User "${userToDelete.full_name || userToDelete.email}" deleted successfully`);
        loadUsers(); // Refresh the list
      } else if (result.error) {
        showError(`Failed to delete user: ${result.error.message}`);
      }
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleUserCreated = (newUser) => {
    // Refresh the users list when a new user is created
    loadUsers();
  };

  const handleEditClick = (user) => {
    setUserToEdit(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role || 'patient',
      phone_number: user.phone_number || '',
      password: '',
      password_confirm: '',
    });
    setEditDialogOpen(true);
  };

  const handleFormSubmit = async () => {
    // Basic validation
    if (!formData.username || !formData.email || !formData.first_name || !formData.last_name) {
      showError('Please fill in all required fields');
      return;
    }

    if (!userToEdit && (!formData.password || formData.password !== formData.password_confirm)) {
      showError('Password and confirm password must match');
      return;
    }

    if (userToEdit && formData.password && formData.password !== formData.password_confirm) {
      showError('Password and confirm password must match');
      return;
    }

    if (userToEdit) {
      // Update existing user
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
        delete updateData.password_confirm;
      }
      const result = await updateUser(userToEdit.id, updateData);
      if (result.data) {
        showSuccess(`User "${result.data.full_name || result.data.email}" updated successfully`);
        loadUsers();
        setEditDialogOpen(false);
        setUserToEdit(null);
      } else if (result.error) {
        showError(`Failed to update user: ${result.error.message}`);
      }
    } else {
      // Create new user
      const result = await createUser(formData);
      if (result.data) {
        showSuccess(`User "${result.data.full_name || result.data.email}" created successfully`);
        loadUsers();
        setCreateDialogOpen(false);
      } else if (result.error) {
        showError(`Failed to create user: ${result.error.message}`);
      }
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'error';
      case 'doctor': return 'primary';
      case 'nurse': return 'secondary';
      case 'patient': return 'success';
      case 'receptionist': return 'info';
      case 'pharmacist': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              User Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage system users and their roles
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadUsers}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
            >
              Add User
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                aria-label="Search users by name, email, or username"
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
                label="Role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="doctor">Doctor</MenuItem>
                <MenuItem value="nurse">Nurse</MenuItem>
                <MenuItem value="patient">Patient</MenuItem>
                <MenuItem value="receptionist">Receptionist</MenuItem>
                <MenuItem value="pharmacist">Pharmacist</MenuItem>
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

        {/* Users Table */}
        <Card>
          <CardContent>
            {loading ? (
              <TableLoader />
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Status</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: { sm: 'none' } }}>
                              {user.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            size="small"
                            color={getRoleColor(user.role)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={user.is_active ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{formatDate(user.created_at)}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(user)}
                            aria-label={`Edit user ${user.full_name || user.email}`}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(user)}
                            aria-label={`Delete user ${user.full_name || user.email}`}
                          >
                            <DeleteIcon />
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
                  Showing {users.length} of {pagination.count} users
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <AdminUserCreateDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onUserCreated={handleUserCreated}
        />

        {/* Edit User Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setUserToEdit(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Edit User
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={formData.username}
                    onChange={(e) => handleFormChange('username', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.first_name}
                    onChange={(e) => handleFormChange('first_name', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.last_name}
                    onChange={(e) => handleFormChange('last_name', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Role"
                    value={formData.role}
                    onChange={(e) => handleFormChange('role', e.target.value)}
                    required
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="doctor">Doctor</MenuItem>
                    <MenuItem value="nurse">Nurse</MenuItem>
                    <MenuItem value="patient">Patient</MenuItem>
                    <MenuItem value="receptionist">Receptionist</MenuItem>
                    <MenuItem value="pharmacist">Pharmacist</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phone_number}
                    onChange={(e) => handleFormChange('phone_number', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password (optional)"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                    helperText="Leave blank to keep current password"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    value={formData.password_confirm}
                    onChange={(e) => handleFormChange('password_confirm', e.target.value)}
                    disabled={!formData.password}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setEditDialogOpen(false);
                setUserToEdit(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              variant="contained"
              disabled={loading}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete User</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete user "{userToDelete?.full_name || userToDelete?.email}"?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default UsersPage;
