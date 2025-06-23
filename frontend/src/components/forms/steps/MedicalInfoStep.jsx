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
  Bloodtype,
  Height,
  FitnessCenter,
  Favorite,
  MedicalServices,
} from '@mui/icons-material';

const MedicalInfoStep = ({ formData, onChange, errors = {} }) => {
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  const bloodTypeOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
    { value: 'UNK', label: 'Unknown' },
  ];

  const maritalStatusOptions = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
    { value: 'separated', label: 'Separated' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Medical Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter medical and health information for the patient. This information is optional but helps provide better care.
      </Typography>

      <Grid container spacing={3}>
        {/* Blood Type */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            name="blood_type"
            label="Blood Type"
            value={formData.blood_type || ''}
            onChange={handleInputChange}
            error={!!errors.blood_type}
            helperText={errors.blood_type}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Bloodtype color="action" />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="">
              <em>Select Blood Type</em>
            </MenuItem>
            {bloodTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Marital Status */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            name="marital_status"
            label="Marital Status"
            value={formData.marital_status || ''}
            onChange={handleInputChange}
            error={!!errors.marital_status}
            helperText={errors.marital_status}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Favorite color="action" />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="">
              <em>Select Marital Status</em>
            </MenuItem>
            {maritalStatusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Height */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="height"
            label="Height (meters)"
            type="number"
            value={formData.height || ''}
            onChange={handleInputChange}
            error={!!errors.height}
            helperText={errors.height}
            inputProps={{
              step: 0.01,
              min: 0.1,
              max: 3.0,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Height color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Weight */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="weight"
            label="Weight (kg)"
            type="number"
            value={formData.weight || ''}
            onChange={handleInputChange}
            error={!!errors.weight}
            helperText={errors.weight}
            inputProps={{
              step: 0.1,
              min: 0.1,
              max: 1000,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FitnessCenter color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Allergies */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            name="allergies"
            label="Allergies"
            value={formData.allergies || ''}
            onChange={handleInputChange}
            error={!!errors.allergies}
            helperText={errors.allergies}
            placeholder="List any known allergies (medications, food, environmental, etc.)"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MedicalServices color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Chronic Conditions */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            name="chronic_conditions"
            label="Chronic Conditions"
            value={formData.chronic_conditions || ''}
            onChange={handleInputChange}
            error={!!errors.chronic_conditions}
            helperText={errors.chronic_conditions}
            placeholder="List any chronic medical conditions"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MedicalServices color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Current Medications */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            name="current_medications"
            label="Current Medications"
            value={formData.current_medications || ''}
            onChange={handleInputChange}
            error={!!errors.current_medications}
            helperText={errors.current_medications}
            placeholder="List current medications and dosages"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MedicalServices color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Family Medical History */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            name="family_medical_history"
            label="Family Medical History"
            value={formData.family_medical_history || ''}
            onChange={handleInputChange}
            error={!!errors.family_medical_history}
            helperText={errors.family_medical_history}
            placeholder="Relevant family medical history"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MedicalServices color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Surgical History */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            name="surgical_history"
            label="Surgical History"
            value={formData.surgical_history || ''}
            onChange={handleInputChange}
            error={!!errors.surgical_history}
            helperText={errors.surgical_history}
            placeholder="Previous surgeries and procedures"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MedicalServices color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MedicalInfoStep;
