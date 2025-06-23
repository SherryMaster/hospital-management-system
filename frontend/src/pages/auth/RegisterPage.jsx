/**
 * RegisterPage Component
 * 
 * User registration page with form validation and role selection
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  LocationCity as CityIcon,
  ContactEmergency as EmergencyIcon,
  LocalHospital as MedicalIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { AuthLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    // Basic Information
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    gender: '',
    password: '',
    password_confirm: '',

    // Address Information
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Pakistan',

    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',

    // Patient-Specific Information
    blood_type: '',
    marital_status: '',
    occupation: '',

    // Insurance Information
    insurance_provider: '',
    insurance_policy_number: '',
    insurance_group_number: '',

    // Medical History
    allergies: '',
    chronic_conditions: '',
    current_medications: '',
    family_medical_history: '',
    surgical_history: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [hasConfirmedReview, setHasConfirmedReview] = useState(false);

  const steps = [
    'Personal Information',
    'Contact & Address',
    'Emergency Contact',
    'Medical Information',
    'Review & Confirm'
  ];

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Basic Information
    if (!formData.first_name?.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!formData.last_name?.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.phone_number) {
      errors.phone_number = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone_number)) {
      errors.phone_number = 'Please enter a valid phone number';
    }

    if (!formData.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required';
    }

    if (!formData.gender) {
      errors.gender = 'Gender is required';
    }

    // Address Information
    if (!formData.address_line_1?.trim()) {
      errors.address_line_1 = 'Address is required';
    }

    if (!formData.city?.trim()) {
      errors.city = 'City is required';
    }

    if (!formData.state?.trim()) {
      errors.state = 'State/Province is required';
    }

    if (!formData.postal_code?.trim()) {
      errors.postal_code = 'Postal code is required';
    }

    if (!formData.country?.trim()) {
      errors.country = 'Country is required';
    }

    // Emergency Contact
    if (!formData.emergency_contact_name?.trim()) {
      errors.emergency_contact_name = 'Emergency contact name is required';
    }

    if (!formData.emergency_contact_phone) {
      errors.emergency_contact_phone = 'Emergency contact phone is required';
    }

    if (!formData.emergency_contact_relationship?.trim()) {
      errors.emergency_contact_relationship = 'Emergency contact relationship is required';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 12) {
      errors.password = 'Password must be at least 12 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }

    if (!formData.password_confirm) {
      errors.password_confirm = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirm) {
      errors.password_confirm = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    clearError();
    setFormErrors({}); // Clear any previous field errors

    try {
      const result = await register(formData);

      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else if (result.fieldErrors) {
        // Handle field-specific errors from backend
        setFormErrors(result.fieldErrors);
      }
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleNext = () => {
    // Validate current step before proceeding
    if (validateCurrentStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    // Reset review confirmation when leaving the review step
    if (activeStep === 4) {
      setHasConfirmedReview(false);
    }
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const validateCurrentStep = () => {
    const errors = {};

    switch (activeStep) {
      case 0: // Personal Information
        if (!formData.first_name?.trim()) errors.first_name = 'First name is required';
        if (!formData.last_name?.trim()) errors.last_name = 'Last name is required';
        if (!formData.email) errors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Please enter a valid email address';
        if (!formData.date_of_birth) errors.date_of_birth = 'Date of birth is required';
        if (!formData.gender) errors.gender = 'Gender is required';
        if (!formData.password) errors.password = 'Password is required';
        else if (formData.password.length < 12) errors.password = 'Password must be at least 12 characters';
        if (formData.password !== formData.password_confirm) errors.password_confirm = 'Passwords do not match';
        break;
      case 1: // Contact & Address
        if (!formData.phone_number) errors.phone_number = 'Phone number is required';
        if (!formData.address_line_1?.trim()) errors.address_line_1 = 'Address is required';
        if (!formData.city?.trim()) errors.city = 'City is required';
        if (!formData.state?.trim()) errors.state = 'State/Province is required';
        if (!formData.postal_code?.trim()) errors.postal_code = 'Postal code is required';
        break;
      case 2: // Emergency Contact
        if (!formData.emergency_contact_name?.trim()) errors.emergency_contact_name = 'Emergency contact name is required';
        if (!formData.emergency_contact_phone) errors.emergency_contact_phone = 'Emergency contact phone is required';
        if (!formData.emergency_contact_relationship?.trim()) errors.emergency_contact_relationship = 'Emergency contact relationship is required';
        break;
      case 3: // Medical Information - all optional
        break;
      case 4: // Review & Confirm - no validation needed
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  if (isLoading) {
    return (
      <AuthLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </AuthLayout>
    );
  }

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="first_name"
                  label="First Name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  error={!!formErrors.first_name}
                  helperText={formErrors.first_name}
                  required
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="last_name"
                  label="Last Name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  error={!!formErrors.last_name}
                  helperText={formErrors.last_name}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="middle_name"
                  label="Middle Name (Optional)"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="date_of_birth"
                  label="Date of Birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  error={!!formErrors.date_of_birth}
                  helperText={formErrors.date_of_birth}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.gender}>
                  <InputLabel>Gender *</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    label="Gender *"
                  >
                    <MenuItem value="M">Male</MenuItem>
                    <MenuItem value="F">Female</MenuItem>
                    <MenuItem value="O">Other</MenuItem>
                    <MenuItem value="P">Prefer not to say</MenuItem>
                  </Select>
                  {formErrors.gender && <FormHelperText>{formErrors.gender}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleTogglePasswordVisibility} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="password_confirm"
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.password_confirm}
                  onChange={handleInputChange}
                  error={!!formErrors.password_confirm}
                  helperText={formErrors.password_confirm}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleToggleConfirmPasswordVisibility} edge="end">
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
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Contact & Address Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="phone_number"
                  label="Phone Number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  error={!!formErrors.phone_number}
                  helperText={formErrors.phone_number}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="address_line_1"
                  label="Address Line 1"
                  value={formData.address_line_1}
                  onChange={handleInputChange}
                  error={!!formErrors.address_line_1}
                  helperText={formErrors.address_line_1}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <HomeIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="address_line_2"
                  label="Address Line 2 (Optional)"
                  value={formData.address_line_2}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="city"
                  label="City"
                  value={formData.city}
                  onChange={handleInputChange}
                  error={!!formErrors.city}
                  helperText={formErrors.city}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CityIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="state"
                  label="State/Province"
                  value={formData.state}
                  onChange={handleInputChange}
                  error={!!formErrors.state}
                  helperText={formErrors.state}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="postal_code"
                  label="Postal Code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  error={!!formErrors.postal_code}
                  helperText={formErrors.postal_code}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="country"
                  label="Country"
                  value={formData.country}
                  onChange={handleInputChange}
                  error={!!formErrors.country}
                  helperText={formErrors.country}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Emergency Contact Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="emergency_contact_name"
                  label="Emergency Contact Name"
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                  error={!!formErrors.emergency_contact_name}
                  helperText={formErrors.emergency_contact_name}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmergencyIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="emergency_contact_phone"
                  label="Emergency Contact Phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleInputChange}
                  error={!!formErrors.emergency_contact_phone}
                  helperText={formErrors.emergency_contact_phone}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="emergency_contact_relationship"
                  label="Relationship"
                  value={formData.emergency_contact_relationship}
                  onChange={handleInputChange}
                  error={!!formErrors.emergency_contact_relationship}
                  helperText={formErrors.emergency_contact_relationship}
                  required
                  placeholder="e.g., Spouse, Parent, Sibling"
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Medical & Personal Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This information helps us provide better care. All fields are optional.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Blood Type</InputLabel>
                  <Select
                    name="blood_type"
                    value={formData.blood_type}
                    onChange={handleInputChange}
                    label="Blood Type"
                  >
                    <MenuItem value="">Select Blood Type</MenuItem>
                    <MenuItem value="A+">A+</MenuItem>
                    <MenuItem value="A-">A-</MenuItem>
                    <MenuItem value="B+">B+</MenuItem>
                    <MenuItem value="B-">B-</MenuItem>
                    <MenuItem value="AB+">AB+</MenuItem>
                    <MenuItem value="AB-">AB-</MenuItem>
                    <MenuItem value="O+">O+</MenuItem>
                    <MenuItem value="O-">O-</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Marital Status</InputLabel>
                  <Select
                    name="marital_status"
                    value={formData.marital_status}
                    onChange={handleInputChange}
                    label="Marital Status"
                  >
                    <MenuItem value="">Select Marital Status</MenuItem>
                    <MenuItem value="single">Single</MenuItem>
                    <MenuItem value="married">Married</MenuItem>
                    <MenuItem value="divorced">Divorced</MenuItem>
                    <MenuItem value="widowed">Widowed</MenuItem>
                    <MenuItem value="separated">Separated</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="occupation"
                  label="Occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Insurance Information (Optional)
                  </Typography>
                </Divider>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="insurance_provider"
                  label="Insurance Provider"
                  value={formData.insurance_provider}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="insurance_policy_number"
                  label="Policy Number"
                  value={formData.insurance_policy_number}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="insurance_group_number"
                  label="Group Number"
                  value={formData.insurance_group_number}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Medical History (Optional)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          name="allergies"
                          label="Known Allergies"
                          value={formData.allergies}
                          onChange={handleInputChange}
                          placeholder="List any known allergies to medications, foods, or other substances"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          name="chronic_conditions"
                          label="Chronic Conditions"
                          value={formData.chronic_conditions}
                          onChange={handleInputChange}
                          placeholder="List any ongoing medical conditions"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          name="current_medications"
                          label="Current Medications"
                          value={formData.current_medications}
                          onChange={handleInputChange}
                          placeholder="List current medications and dosages"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          name="family_medical_history"
                          label="Family Medical History"
                          value={formData.family_medical_history}
                          onChange={handleInputChange}
                          placeholder="Relevant family medical history"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          name="surgical_history"
                          label="Surgical History"
                          value={formData.surgical_history}
                          onChange={handleInputChange}
                          placeholder="Previous surgeries and procedures"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>
          </Box>
        );
      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Confirm Your Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please review all the information you've entered. You can go back to make changes if needed.
            </Typography>

            {/* Personal Information Summary */}
            <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Personal Information
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {formData.first_name} {formData.middle_name} {formData.last_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Email:</strong> {formData.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Date of Birth:</strong> {formData.date_of_birth}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Gender:</strong> {
                      formData.gender === 'M' ? 'Male' :
                      formData.gender === 'F' ? 'Female' :
                      formData.gender === 'O' ? 'Other' :
                      formData.gender === 'P' ? 'Prefer not to say' : ''
                    }
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Contact Information Summary */}
            <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Contact & Address
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {formData.phone_number}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Address:</strong> {formData.address_line_1}
                    {formData.address_line_2 && `, ${formData.address_line_2}`}
                    <br />
                    {formData.city}, {formData.state} {formData.postal_code}, {formData.country}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Emergency Contact Summary */}
            <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Emergency Contact
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {formData.emergency_contact_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {formData.emergency_contact_phone}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Relationship:</strong> {formData.emergency_contact_relationship}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Medical Information Summary */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Medical Information
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Blood Type:</strong> {formData.blood_type || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Marital Status:</strong> {formData.marital_status || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Occupation:</strong> {formData.occupation || 'Not specified'}
                  </Typography>
                </Grid>
                {formData.insurance_provider && (
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Insurance:</strong> {formData.insurance_provider}
                      {formData.insurance_policy_number && ` (Policy: ${formData.insurance_policy_number})`}
                    </Typography>
                  </Grid>
                )}
                {(formData.allergies || formData.chronic_conditions || formData.current_medications) && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Medical History:</strong> Additional medical information provided
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Confirmation */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Please review all the information above carefully. Once you confirm, your account will be created.
              </Typography>
            </Alert>

            {/* Review Confirmation Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={hasConfirmedReview}
                  onChange={(e) => setHasConfirmedReview(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  I have reviewed all the information above and confirm that it is accurate.
                  I agree to the terms of service and privacy policy.
                </Typography>
              }
              sx={{ mb: 2 }}
            />
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <AuthLayout
      title="Patient Registration"
      subtitle="Register as a Patient - Healthcare professionals must contact administrators"
      maxWidth="lg"
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        {/* Global Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Information Alert */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Patient Registration Only:</strong> This form is for patient registration only.
            Healthcare professionals (doctors, nurses, staff) must contact system administrators
            to create their accounts with proper credentials and access levels.
          </Typography>
        </Alert>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          {renderStepContent(activeStep)}
        </Paper>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          {activeStep === steps.length - 1 ? (
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || !hasConfirmedReview}
              sx={{ minWidth: 120 }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          )}
        </Box>

        {/* Links */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" variant="body2">
              Sign in here
            </Link>
          </Typography>
        </Box>
      </Box>
    </AuthLayout>
  );
};

export default RegisterPage;
