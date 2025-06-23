import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  MenuItem,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Person,
  Email,
  AccountCircle,
  Visibility,
  VisibilityOff,
  Cake,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const PersonalInfoStep = ({ formData, onChange, errors = {} }) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  const handleDateChange = (name, value) => {
    // Format the date to YYYY-MM-DD string format for the backend
    const formattedValue = value ? value.format('YYYY-MM-DD') : '';
    onChange(name, formattedValue);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const genderOptions = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'O', label: 'Other' },
    { value: 'P', label: 'Prefer not to say' },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Personal Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter the basic personal details and account credentials for the new user.
      </Typography>

      <Grid container spacing={3}>
        {/* First Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="first_name"
            label="First Name"
            value={formData.first_name || ''}
            onChange={handleInputChange}
            error={!!errors.first_name}
            helperText={errors.first_name}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Last Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="last_name"
            label="Last Name"
            value={formData.last_name || ''}
            onChange={handleInputChange}
            error={!!errors.last_name}
            helperText={errors.last_name}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Username */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="username"
            label="Username"
            value={formData.username || ''}
            onChange={handleInputChange}
            error={!!errors.username}
            helperText={errors.username}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Email */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="email"
            label="Email Address"
            type="email"
            value={formData.email || ''}
            onChange={handleInputChange}
            error={!!errors.email}
            helperText={errors.email}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Date of Birth */}
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="Date of Birth"
            value={formData.date_of_birth ? dayjs(formData.date_of_birth) : null}
            onChange={(value) => handleDateChange('date_of_birth', value)}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!errors.date_of_birth,
                helperText: errors.date_of_birth,
                InputProps: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Cake color="action" />
                    </InputAdornment>
                  ),
                },
              },
            }}
          />
        </Grid>

        {/* Gender */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            name="gender"
            label="Gender"
            value={formData.gender || ''}
            onChange={handleInputChange}
            error={!!errors.gender}
            helperText={errors.gender}
          >
            <MenuItem value="">
              <em>Select Gender</em>
            </MenuItem>
            {genderOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Password */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password || ''}
            onChange={handleInputChange}
            error={!!errors.password}
            helperText={errors.password}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={togglePasswordVisibility}
                    edge="end"
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Confirm Password */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="password_confirm"
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.password_confirm || ''}
            onChange={handleInputChange}
            error={!!errors.password_confirm}
            helperText={errors.password_confirm}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={toggleConfirmPasswordVisibility}
                    edge="end"
                    aria-label="toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default PersonalInfoStep;
