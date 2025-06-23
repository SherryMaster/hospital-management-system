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
  AttachMoney,
  Work,
  CalendarToday,
} from '@mui/icons-material';

const DoctorEmploymentStep = ({ formData, onChange, errors = {} }) => {
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  const employmentStatusOptions = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'resident', label: 'Resident' },
    { value: 'intern', label: 'Intern' },
    { value: 'retired', label: 'Retired' },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Employment Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter employment and department information for the doctor.
      </Typography>

      <Grid container spacing={3}>
        {/* Department */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="department_name"
            label="Department"
            value={formData.department_name || ''}
            onChange={handleInputChange}
            error={!!errors.department_name}
            helperText={errors.department_name}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Business color="action" />
                </InputAdornment>
              ),
            }}
          />
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

        {/* Consultation Fee */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="consultation_fee"
            label="Consultation Fee"
            type="number"
            value={formData.consultation_fee || ''}
            onChange={handleInputChange}
            error={!!errors.consultation_fee}
            helperText={errors.consultation_fee}
            inputProps={{
              min: 0,
              step: 0.01,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Hire Date */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="hire_date"
            label="Hire Date"
            type="date"
            value={formData.hire_date || ''}
            onChange={handleInputChange}
            error={!!errors.hire_date}
            helperText={errors.hire_date}
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarToday color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DoctorEmploymentStep;
