import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  AdminPanelSettings,
  Business,
} from '@mui/icons-material';

const AdminDetailsStep = ({ formData, onChange, errors = {} }) => {
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  const accessLevelOptions = [
    { value: 'super_admin', label: 'Super Administrator' },
    { value: 'system_admin', label: 'System Administrator' },
    { value: 'department_admin', label: 'Department Administrator' },
    { value: 'data_admin', label: 'Data Administrator' },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Administrator Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter access level and administrative information for the administrator.
      </Typography>

      <Grid container spacing={3}>
        {/* Access Level */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            name="access_level"
            label="Access Level"
            value={formData.access_level || ''}
            onChange={handleInputChange}
            error={!!errors.access_level}
            helperText={errors.access_level}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AdminPanelSettings color="action" />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="">
              <em>Select Access Level</em>
            </MenuItem>
            {accessLevelOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Office Location */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="office_location"
            label="Office Location"
            value={formData.office_location || ''}
            onChange={handleInputChange}
            error={!!errors.office_location}
            helperText={errors.office_location}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Business color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDetailsStep;
