import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material';
import {
  Phone,
  Home,
  LocationCity,
  Public,
  MarkunreadMailbox,
} from '@mui/icons-material';

const ContactInfoStep = ({ formData, onChange, errors = {} }) => {
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Contact & Address Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter the contact information and address details for the new user.
      </Typography>

      <Grid container spacing={3}>
        {/* Phone Number */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="phone_number"
            label="Phone Number"
            value={formData.phone_number || ''}
            onChange={handleInputChange}
            error={!!errors.phone_number}
            helperText={errors.phone_number}
            required
            placeholder="+1234567890"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Phone color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Address */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="address"
            label="Street Address"
            value={formData.address || ''}
            onChange={handleInputChange}
            error={!!errors.address}
            helperText={errors.address}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Home color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* City */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="city"
            label="City"
            value={formData.city || ''}
            onChange={handleInputChange}
            error={!!errors.city}
            helperText={errors.city}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationCity color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* State/Province */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="state"
            label="State/Province"
            value={formData.state || ''}
            onChange={handleInputChange}
            error={!!errors.state}
            helperText={errors.state}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationCity color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Postal Code */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="postal_code"
            label="Postal Code"
            value={formData.postal_code || ''}
            onChange={handleInputChange}
            error={!!errors.postal_code}
            helperText={errors.postal_code}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MarkunreadMailbox color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Country */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="country"
            label="Country"
            value={formData.country || ''}
            onChange={handleInputChange}
            error={!!errors.country}
            helperText={errors.country}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Public color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContactInfoStep;
