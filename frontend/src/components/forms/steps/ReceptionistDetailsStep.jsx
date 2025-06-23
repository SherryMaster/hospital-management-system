import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  Chip,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import {
  Business,
  Language,
} from '@mui/icons-material';

const ReceptionistDetailsStep = ({ formData, onChange, errors = {} }) => {
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  const handleLanguagesChange = (event, newValue) => {
    onChange('languages_spoken', newValue);
  };

  const commonLanguages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Chinese (Mandarin)',
    'Chinese (Cantonese)',
    'Japanese',
    'Korean',
    'Arabic',
    'Hindi',
    'Russian',
    'Dutch',
    'Swedish',
    'Norwegian',
    'Danish',
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Receptionist Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter reception area and language skills for the receptionist.
      </Typography>

      <Grid container spacing={3}>
        {/* Reception Area */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="reception_area"
            label="Reception Area"
            value={formData.reception_area || ''}
            onChange={handleInputChange}
            error={!!errors.reception_area}
            helperText={errors.reception_area}
            placeholder="e.g., Main Lobby, Emergency Department, Outpatient Clinic"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Business color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Languages Spoken */}
        <Grid item xs={12}>
          <Autocomplete
            multiple
            options={commonLanguages}
            value={formData.languages_spoken || []}
            onChange={handleLanguagesChange}
            freeSolo
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({ index })}
                  key={index}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Languages Spoken"
                placeholder="Select or type languages"
                error={!!errors.languages_spoken}
                helperText={errors.languages_spoken || "Select languages or type new ones"}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <Language color="action" />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReceptionistDetailsStep;
