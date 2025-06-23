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
  Badge,
  School,
  CalendarToday,
  LocalHospital,
} from '@mui/icons-material';

const NurseCredentialsStep = ({ formData, onChange, errors = {} }) => {
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  const nursingLevelOptions = [
    { value: 'cna', label: 'Certified Nursing Assistant' },
    { value: 'lpn', label: 'Licensed Practical Nurse' },
    { value: 'rn', label: 'Registered Nurse' },
    { value: 'bsn', label: 'Bachelor of Science in Nursing' },
    { value: 'msn', label: 'Master of Science in Nursing' },
    { value: 'np', label: 'Nurse Practitioner' },
  ];

  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from(
    { length: currentYear - 1950 + 1 },
    (_, i) => currentYear - i
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Nursing Credentials
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter the nurse's license information and educational background.
      </Typography>

      <Grid container spacing={3}>
        {/* Nursing License Number */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="license_number"
            label="Nursing License Number"
            value={formData.license_number || ''}
            onChange={handleInputChange}
            error={!!errors.license_number}
            helperText={errors.license_number}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Badge color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Nursing Level */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            name="nursing_level"
            label="Nursing Level"
            value={formData.nursing_level || ''}
            onChange={handleInputChange}
            error={!!errors.nursing_level}
            helperText={errors.nursing_level}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocalHospital color="action" />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="">
              <em>Select Nursing Level</em>
            </MenuItem>
            {nursingLevelOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Nursing School */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="nursing_school"
            label="Nursing School"
            value={formData.nursing_school || ''}
            onChange={handleInputChange}
            error={!!errors.nursing_school}
            helperText={errors.nursing_school}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <School color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Graduation Year */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            name="graduation_year"
            label="Graduation Year"
            value={formData.graduation_year || ''}
            onChange={handleInputChange}
            error={!!errors.graduation_year}
            helperText={errors.graduation_year}
            SelectProps={{
              native: true,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarToday color="action" />
                </InputAdornment>
              ),
            }}
          >
            <option value="">Select Graduation Year</option>
            {graduationYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NurseCredentialsStep;
