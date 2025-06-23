import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  InputAdornment,
  Chip,
  Autocomplete,
  MenuItem,
} from '@mui/material';
import {
  Badge,
  School,
  CalendarToday,
  Work,
  Business,
} from '@mui/icons-material';
import { doctorService } from '../../../services/api';

const DoctorCredentialsStep = ({ formData, onChange, errors = {} }) => {
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data, error } = await doctorService.getDepartments();
        if (data && !error) {
          setDepartments(data.results || data);
        } else {
          console.error('Failed to fetch departments:', error);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  const handleSpecializationsChange = (event, newValue) => {
    onChange('specializations', newValue);
  };

  // Common medical specializations
  const specializationOptions = [
    'Cardiology',
    'Dermatology',
    'Emergency Medicine',
    'Endocrinology',
    'Family Medicine',
    'Gastroenterology',
    'General Surgery',
    'Hematology',
    'Internal Medicine',
    'Neurology',
    'Obstetrics and Gynecology',
    'Oncology',
    'Ophthalmology',
    'Orthopedics',
    'Otolaryngology',
    'Pathology',
    'Pediatrics',
    'Psychiatry',
    'Pulmonology',
    'Radiology',
    'Rheumatology',
    'Urology',
  ];

  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from(
    { length: currentYear - 1950 + 1 },
    (_, i) => currentYear - i
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Medical Credentials
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter the doctor's medical license information and educational background.
      </Typography>

      <Grid container spacing={3}>
        {/* Medical License Number */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="license_number"
            label="Medical License Number"
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

        {/* Department */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            name="department"
            label="Department"
            value={formData.department || ''}
            onChange={handleInputChange}
            error={!!errors.department}
            helperText={errors.department}
            required
            disabled={loadingDepartments}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Business color="action" />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="">
              {loadingDepartments ? 'Loading departments...' : 'Select Department'}
            </MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Medical School */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="medical_school"
            label="Medical School"
            value={formData.medical_school || ''}
            onChange={handleInputChange}
            error={!!errors.medical_school}
            helperText={errors.medical_school}
            required
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
            required
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
              max: 70,
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

        {/* Specializations */}
        <Grid item xs={12}>
          <Autocomplete
            multiple
            options={specializationOptions}
            value={formData.specializations || []}
            onChange={handleSpecializationsChange}
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
                label="Specializations"
                placeholder="Select or type specializations"
                error={!!errors.specializations}
                helperText={errors.specializations || "Select existing specializations or type new ones"}
              />
            )}
          />
        </Grid>

        {/* Residency Program */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="residency_program"
            label="Residency Program"
            value={formData.residency_program || ''}
            onChange={handleInputChange}
            error={!!errors.residency_program}
            helperText={errors.residency_program}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <School color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Fellowship Program */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="fellowship_program"
            label="Fellowship Program"
            value={formData.fellowship_program || ''}
            onChange={handleInputChange}
            error={!!errors.fellowship_program}
            helperText={errors.fellowship_program}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <School color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Certifications */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            name="certifications"
            label="Certifications"
            value={formData.certifications || ''}
            onChange={handleInputChange}
            error={!!errors.certifications}
            helperText={errors.certifications}
            placeholder="List professional certifications and credentials"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Badge color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DoctorCredentialsStep;
