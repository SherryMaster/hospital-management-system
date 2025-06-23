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
  Business,
  Work,
  Schedule,
  LocalHospital,
} from '@mui/icons-material';

const NurseEmploymentStep = ({ formData, onChange, errors = {} }) => {
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  const shiftOptions = [
    { value: 'day', label: 'Day Shift (7AM-7PM)' },
    { value: 'night', label: 'Night Shift (7PM-7AM)' },
    { value: 'rotating', label: 'Rotating Shifts' },
    { value: 'on_call', label: 'On-Call' },
  ];

  const employmentStatusOptions = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'per_diem', label: 'Per Diem' },
    { value: 'travel', label: 'Travel Nurse' },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Employment Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter department, unit, and employment information for the nurse.
      </Typography>

      <Grid container spacing={3}>
        {/* Department */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="department"
            label="Department"
            value={formData.department || ''}
            onChange={handleInputChange}
            error={!!errors.department}
            helperText={errors.department}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Business color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Unit */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="unit"
            label="Unit"
            value={formData.unit || ''}
            onChange={handleInputChange}
            error={!!errors.unit}
            helperText={errors.unit}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocalHospital color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Shift Preference */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            name="shift_preference"
            label="Shift Preference"
            value={formData.shift_preference || ''}
            onChange={handleInputChange}
            error={!!errors.shift_preference}
            helperText={errors.shift_preference}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Schedule color="action" />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="">
              <em>Select Shift Preference</em>
            </MenuItem>
            {shiftOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Employment Status */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            name="employment_status"
            label="Employment Status"
            value={formData.employment_status || ''}
            onChange={handleInputChange}
            error={!!errors.employment_status}
            helperText={errors.employment_status}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Work color="action" />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="">
              <em>Select Employment Status</em>
            </MenuItem>
            {employmentStatusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Years of Experience */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="years_of_experience"
            label="Years of Experience"
            type="number"
            value={formData.years_of_experience || ''}
            onChange={handleInputChange}
            error={!!errors.years_of_experience}
            helperText={errors.years_of_experience}
            inputProps={{
              min: 0,
              max: 50,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Work color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default NurseEmploymentStep;
