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
  ContactEmergency,
  Phone,
  People,
} from '@mui/icons-material';

const EmergencyContactStep = ({ formData, onChange, errors = {} }) => {
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  const relationshipOptions = [
    'Spouse',
    'Parent',
    'Child',
    'Sibling',
    'Friend',
    'Guardian',
    'Other Family Member',
    'Other',
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Emergency Contact Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter emergency contact details for the new user. This information will be used in case of emergencies.
      </Typography>

      <Grid container spacing={3}>
        {/* Emergency Contact Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="emergency_contact_name"
            label="Emergency Contact Name"
            value={formData.emergency_contact_name || ''}
            onChange={handleInputChange}
            error={!!errors.emergency_contact_name}
            helperText={errors.emergency_contact_name}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ContactEmergency color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Emergency Contact Phone */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="emergency_contact_phone"
            label="Emergency Contact Phone"
            value={formData.emergency_contact_phone || ''}
            onChange={handleInputChange}
            error={!!errors.emergency_contact_phone}
            helperText={errors.emergency_contact_phone}
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

        {/* Relationship */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            name="emergency_contact_relationship"
            label="Relationship"
            value={formData.emergency_contact_relationship || ''}
            onChange={handleInputChange}
            error={!!errors.emergency_contact_relationship}
            helperText={errors.emergency_contact_relationship}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <People color="action" />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="">
              <em>Select Relationship</em>
            </MenuItem>
            {relationshipOptions.map((relationship) => (
              <MenuItem key={relationship} value={relationship}>
                {relationship}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmergencyContactStep;
