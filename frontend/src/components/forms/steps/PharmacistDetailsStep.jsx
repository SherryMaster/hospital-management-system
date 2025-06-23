import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  FormControlLabel,
  Switch,
  InputAdornment,
} from '@mui/material';
import {
  Badge,
  School,
  LocalPharmacy,
} from '@mui/icons-material';

const PharmacistDetailsStep = ({ formData, onChange, errors = {} }) => {
  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    onChange(name, type === 'checkbox' ? checked : value);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Pharmacist Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter pharmacy license and professional information for the pharmacist.
      </Typography>

      <Grid container spacing={3}>
        {/* Pharmacy License Number */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="pharmacy_license_number"
            label="Pharmacy License Number"
            value={formData.pharmacy_license_number || ''}
            onChange={handleInputChange}
            error={!!errors.pharmacy_license_number}
            helperText={errors.pharmacy_license_number}
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

        {/* Pharmacy School */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="pharmacy_school"
            label="Pharmacy School"
            value={formData.pharmacy_school || ''}
            onChange={handleInputChange}
            error={!!errors.pharmacy_school}
            helperText={errors.pharmacy_school}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <School color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Can Dispense Controlled Substances */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                name="can_dispense_controlled_substances"
                checked={formData.can_dispense_controlled_substances || false}
                onChange={handleInputChange}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocalPharmacy sx={{ mr: 1, color: 'action.active' }} />
                <Typography>Can Dispense Controlled Substances</Typography>
              </Box>
            }
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default PharmacistDetailsStep;
