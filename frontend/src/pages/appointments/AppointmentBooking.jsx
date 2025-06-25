/**
 * AppointmentBooking Component
 * 
 * Patient-facing appointment booking form with doctor selection and time slot picker
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocalHospital as HospitalIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';
import { useAppointments } from '../../hooks/useApi';
import { doctorService, appointmentService, departmentService, patientService } from '../../services/api';

const AppointmentBooking = () => {
  const { user, logout, refreshUser } = useAuth();
  const { createAppointment } = useAppointments();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [formData, setFormData] = useState({
    department: '',
    doctor: '',
    appointmentDate: null,
    timeSlot: '',
    appointmentType: 'consultation',
    chiefComplaint: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [availableData, setAvailableData] = useState({
    departments: [],
    doctors: [],
    timeSlots: [],
  });

  const steps = ['Select Department & Doctor', 'Choose Date & Time', 'Appointment Details', 'Confirmation'];

  useEffect(() => {
    loadDepartments();
    loadPatientProfile();
    // Refresh user data to ensure we have the latest patient profile information
    if (refreshUser) {
      refreshUser();
    }
  }, [refreshUser]);

  const loadPatientProfile = async () => {
    if (user?.role !== 'patient') return;

    setProfileLoading(true);
    try {
      const { data, error } = await patientService.getMyProfile();
      if (error) {
        console.error('Failed to load patient profile:', error);
      } else {
        setPatientProfile(data);
      }
    } catch (error) {
      console.error('Failed to load patient profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (formData.department) {
      loadDoctorsByDepartment(formData.department);
    }
  }, [formData.department]);

  useEffect(() => {
    if (formData.doctor && formData.appointmentDate) {
      loadAvailableTimeSlots(formData.doctor, formData.appointmentDate);
    }
  }, [formData.doctor, formData.appointmentDate]);

  const loadDepartments = async () => {
    try {
      // Try to fetch real departments from API
      const result = await departmentService.getDepartments();

      if (result.data?.results) {
        setAvailableData(prev => ({
          ...prev,
          departments: result.data.results.map(dept => ({
            id: dept.id,
            name: dept.name,
            description: dept.description || `${dept.name} department`
          }))
        }));
      } else {
        // Fallback to simulated data if API fails
        setAvailableData(prev => ({
          ...prev,
          departments: [
            { id: 1, name: 'Cardiology', description: 'Heart and cardiovascular care' },
            { id: 2, name: 'General Medicine', description: 'Primary healthcare services' },
            { id: 3, name: 'Dermatology', description: 'Skin and hair care' },
            { id: 4, name: 'Orthopedics', description: 'Bone and joint care' },
            { id: 5, name: 'Pediatrics', description: 'Children healthcare' },
          ],
        }));
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      setAvailableData(prev => ({
        ...prev,
        departments: [],
      }));
    }
  };

  const loadDoctorsByDepartment = async (departmentId) => {
    try {
      // Try to fetch real doctors from API
      const result = await doctorService.getDoctors({ department: departmentId });

      if (result.data?.results) {
        // Use API data
        setAvailableData(prev => ({
          ...prev,
          doctors: result.data.results.map(doctor => ({
            id: doctor.id, // Doctor model ID
            userId: doctor.user?.id, // User model ID (needed for appointment creation)
            name: doctor.user?.full_name || doctor.full_name || 'Unknown Doctor',
            specialization: doctor.specializations?.[0]?.name || doctor.department?.name || 'General Medicine',
            experience: doctor.years_of_experience ? `${doctor.years_of_experience} years` : 'Experience not specified',
            rating: doctor.rating || 4.5,
            fee: doctor.consultation_fee || 150
          }))
        }));
      } else {
        // No doctors found
        setAvailableData(prev => ({
          ...prev,
          doctors: [],
        }));
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      setAvailableData(prev => ({
        ...prev,
        doctors: [],
      }));
    }
  };

  const loadAvailableTimeSlots = async (doctorId, date) => {
    try {
      // Try to fetch real available slots from API
      const result = await appointmentService.getAvailableSlots(doctorId, date.toISOString().split('T')[0]);

      if (result.data && result.data.available_slots) {
        // Use API data - available_slots is an array of time strings
        const slots = result.data.available_slots;
        setAvailableData(prev => ({
          ...prev,
          timeSlots: slots.map((timeString, index) => ({
            id: index + 1,
            time: timeString,
            available: true
          }))
        }));
      } else if (result.error) {
        console.error('Error loading time slots:', result.error);
        setAvailableData(prev => ({
          ...prev,
          timeSlots: []
        }));
      } else {
        // No available slots
        setAvailableData(prev => ({
          ...prev,
          timeSlots: []
        }));
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
      setAvailableData(prev => ({
        ...prev,
        timeSlots: []
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user makes changes
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateStep = (step) => {
    const errors = {};

    switch (step) {
      case 0: // Department & Doctor
        if (!formData.department) {
          errors.department = 'Please select a department';
        }
        if (!formData.doctor) {
          errors.doctor = 'Please select a doctor';
        }
        break;

      case 1: // Date & Time
        if (!formData.appointmentDate) {
          errors.appointmentDate = 'Please select an appointment date';
        }
        if (!formData.timeSlot) {
          errors.timeSlot = 'Please select a time slot';
        }
        break;

      case 2: // Appointment Details
        if (!formData.appointmentType) {
          errors.appointmentType = 'Please select appointment type';
        }
        if (!formData.chiefComplaint.trim()) {
          errors.chiefComplaint = 'Please describe your chief complaint';
        }
        break;

      default:
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setLoading(true);
    try {
      // Prepare appointment data for API
      const selectedTimeSlot = getSelectedTimeSlot();
      const selectedDoctor = getSelectedDoctor();

      // Validate required data
      if (!selectedDoctor?.userId) {
        throw new Error('Selected doctor information is incomplete. Please try selecting the doctor again.');
      }

      // Check for patient profile - try multiple approaches
      let patientId = null;
      if (user?.patient_profile?.id) {
        patientId = user.patient_profile.id;
      } else if (patientProfile?.id) {
        // Use the patientProfile from the separate API call
        patientId = patientProfile.id;
      } else if (user?.role === 'patient') {
        // If user is a patient but no profile found, try to get it from the separate API call
        console.warn('Patient profile not found in user object, but user is a patient. Checking patientProfile state...');
        if (patientProfile?.id) {
          patientId = patientProfile.id;
        }
      }

      if (!patientId) {
        throw new Error('Patient profile not found. Please ensure you are logged in as a patient and your profile is complete.');
      }

      const appointmentData = {
        patient: patientId,
        doctor: selectedDoctor.userId, // Use User ID, not Doctor model ID
        department: formData.department,
        appointment_date: formData.appointmentDate ? formData.appointmentDate.format('YYYY-MM-DD') : '',
        appointment_time: selectedTimeSlot?.time || formData.timeSlot,
        appointment_type: formData.appointmentType,
        chief_complaint: formData.chiefComplaint,
        notes: formData.notes,
        status: 'scheduled' // Use 'scheduled' instead of 'pending'
      };

      // Create appointment via API
      const result = await createAppointment(appointmentData);

      if (result.error) {
        throw new Error(result.error.message || 'Failed to book appointment');
      }

      // Show success and redirect
      alert('Appointment booked successfully!');
      // Reset form
      setFormData({
        department: '',
        doctor: '',
        appointmentDate: null,
        timeSlot: '',
        appointmentType: 'consultation',
        chiefComplaint: '',
        notes: '',
      });
      setActiveStep(0);
      // navigate('/appointments');
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert(error.message || 'Error booking appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedDepartment = () => {
    return availableData.departments.find(dept => dept.id === formData.department);
  };

  const getSelectedDoctor = () => {
    return availableData.doctors.find(doc => doc.id === formData.doctor);
  };

  const getSelectedTimeSlot = () => {
    return availableData.timeSlots.find(slot => slot.id === formData.timeSlot);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            {/* Department Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth error={!!formErrors.department}>
                <InputLabel>Select Department</InputLabel>
                <Select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  label="Select Department"
                >
                  {availableData.departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      <Box>
                        <Typography variant="body1">{dept.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dept.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.department && (
                  <FormHelperText>{formErrors.department}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Doctor Selection */}
            {formData.department && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Available Doctors
                </Typography>
                {availableData.doctors.length > 0 ? (
                  <List>
                    {availableData.doctors.map((doctor) => (
                      <ListItem key={doctor.id} disablePadding>
                        <ListItemButton
                          selected={formData.doctor === doctor.id}
                          onClick={() => handleInputChange('doctor', doctor.id)}
                          sx={{
                            border: 1,
                            borderColor: formData.doctor === doctor.id ? 'primary.main' : 'divider',
                            borderRadius: 1,
                            mb: 1,
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <PersonIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={doctor.name}
                            secondary={
                              <span>
                                <span style={{ display: 'block', color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>
                                  {doctor.specialization} • {doctor.experience}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                  <Chip label={`Rating: ${doctor.rating}`} size="small" color="success" />
                                  <Chip label={`Fee: $${doctor.fee}`} size="small" color="info" />
                                </span>
                              </span>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No doctors available in this department. Please try selecting a different department.
                  </Alert>
                )}
                {formErrors.doctor && (
                  <Typography variant="caption" color="error">
                    {formErrors.doctor}
                  </Typography>
                )}
              </Grid>
            )}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            {/* Date Selection */}
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Appointment Date"
                value={formData.appointmentDate}
                onChange={(date) => handleInputChange('appointmentDate', date)}
                minDate={dayjs()}
                maxDate={dayjs().add(30, 'day')} // 30 days from now
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!formErrors.appointmentDate,
                    helperText: formErrors.appointmentDate,
                  },
                }}
              />
            </Grid>

            {/* Time Slot Selection */}
            {formData.appointmentDate && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Available Time Slots
                </Typography>
                {availableData.timeSlots.length > 0 ? (
                  <Grid container spacing={1}>
                    {availableData.timeSlots.map((slot) => (
                      <Grid item xs={6} sm={4} md={3} key={slot.id}>
                        <Button
                          fullWidth
                          variant={formData.timeSlot === slot.id ? 'contained' : 'outlined'}
                          disabled={!slot.available}
                          onClick={() => handleInputChange('timeSlot', slot.id)}
                          sx={{ py: 1.5 }}
                        >
                          {slot.time}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    No available time slots for the selected date and doctor. Please try a different date.
                  </Alert>
                )}
                {formErrors.timeSlot && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {formErrors.timeSlot}
                  </Typography>
                )}
              </Grid>
            )}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            {/* Appointment Type */}
            <Grid item xs={12}>
              <FormControl component="fieldset" error={!!formErrors.appointmentType}>
                <Typography variant="h6" gutterBottom>
                  Appointment Type
                </Typography>
                <RadioGroup
                  value={formData.appointmentType}
                  onChange={(e) => handleInputChange('appointmentType', e.target.value)}
                  row
                >
                  <FormControlLabel value="consultation" control={<Radio />} label="Consultation" />
                  <FormControlLabel value="follow-up" control={<Radio />} label="Follow-up" />
                  <FormControlLabel value="check-up" control={<Radio />} label="Check-up" />
                  <FormControlLabel value="emergency" control={<Radio />} label="Emergency" />
                </RadioGroup>
                {formErrors.appointmentType && (
                  <FormHelperText>{formErrors.appointmentType}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Chief Complaint */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Chief Complaint"
                multiline
                rows={3}
                value={formData.chiefComplaint}
                onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                error={!!formErrors.chiefComplaint}
                helperText={formErrors.chiefComplaint || 'Please describe your main health concern'}
                required
              />
            </Grid>

            {/* Additional Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes (Optional)"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                helperText="Any additional information you'd like the doctor to know"
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Appointment Summary
            </Typography>

            {/* Patient Information Summary */}
            {patientProfile && (
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Patient Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Patient Name</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {`${patientProfile.user?.first_name || ''} ${patientProfile.user?.middle_name ? patientProfile.user.middle_name + ' ' : ''}${patientProfile.user?.last_name || ''}`.trim()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Patient ID</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {patientProfile.patient_id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Blood Type</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {patientProfile.blood_type || 'Not specified'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Contact</Typography>
                    <Typography variant="body1">
                      {patientProfile.user?.phone_number || 'Not provided'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Appointment Details Summary */}
            <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Appointment Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Department</Typography>
                  <Typography variant="body1">{getSelectedDepartment()?.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Doctor</Typography>
                  <Typography variant="body1">{getSelectedDoctor()?.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Date</Typography>
                  <Typography variant="body1">
                    {formData.appointmentDate?.format('MMMM D, YYYY')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Time</Typography>
                  <Typography variant="body1">{getSelectedTimeSlot()?.time}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {formData.appointmentType}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Consultation Fee</Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary.main">
                    ${getSelectedDoctor()?.fee}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Chief Complaint</Typography>
                  <Typography variant="body1">{formData.chiefComplaint}</Typography>
                </Grid>
                {formData.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Additional Notes</Typography>
                    <Typography variant="body1">{formData.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Important Medical Information Alert */}
            {patientProfile && (patientProfile.allergies || patientProfile.chronic_conditions) && (
              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Important Medical Information
                </Typography>
                {patientProfile.allergies && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Allergies:</strong> {patientProfile.allergies}
                  </Typography>
                )}
                {patientProfile.chronic_conditions && (
                  <Typography variant="body2">
                    <strong>Chronic Conditions:</strong> {patientProfile.chronic_conditions}
                  </Typography>
                )}
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout user={user} onLogout={logout}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Book Appointment
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Schedule your appointment with our healthcare professionals
          </Typography>
        </Box>

        {/* Patient Information Card */}
        {user?.role === 'patient' && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                Patient Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {profileLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Loading patient information...
                  </Typography>
                </Box>
              ) : patientProfile ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Patient Name</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {`${patientProfile.user?.first_name || ''} ${patientProfile.user?.middle_name ? patientProfile.user.middle_name + ' ' : ''}${patientProfile.user?.last_name || ''}`.trim() || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Patient ID</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {patientProfile.patient_id || 'Not assigned'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Blood Type</Typography>
                      <Typography variant="body1" fontWeight="medium" color="error.main">
                        {patientProfile.blood_type || 'Not specified'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Age</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {patientProfile.age || 'Not calculated'}
                      </Typography>
                    </Box>
                  </Grid>
                  {patientProfile.allergies && (
                    <Grid item xs={12}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Known Allergies</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {patientProfile.allergies.split(',').map((allergy, index) => (
                            <Chip
                              key={index}
                              label={allergy.trim()}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  {patientProfile.chronic_conditions && (
                    <Grid item xs={12}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Chronic Conditions</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {patientProfile.chronic_conditions.split(',').map((condition, index) => (
                            <Chip
                              key={index}
                              label={condition.trim()}
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Alert severity="warning">
                  Unable to load patient information. Please ensure your profile is complete.
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stepper */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            {renderStepContent(activeStep)}
          </CardContent>

          {/* Navigation Buttons */}
          <Divider />
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
              >
                {loading ? 'Booking...' : 'Book Appointment'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForwardIcon />}
              >
                Next
              </Button>
            )}
          </Box>
        </Card>
      </Box>
    </MainLayout>
  );
};

export default AppointmentBooking;
